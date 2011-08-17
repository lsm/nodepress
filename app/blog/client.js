var script = np.script;

// client side code
function mainJs($) {
  var np = $.np;
  np.showdown = new Showdown.converter();
  np.formatDate = function(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('/');
  }
  np.data = {};
  var dom = np.dom;
  // rest apis and remote calls
  var api = {
    list: function(query) {
      np.params = query || np.params;
      var skip = np.params.skip || 0;
      var limit = np.params.limit || 20;
      var tags = np.params.tags || [];
      var url = '/_api/blog/list/' + skip + '/' + limit + '/';
      if (tags.length > 0) {
        url += tags.join(',') + '/';
      }
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(data, status) {
          np.params = {
            skip: skip,
            limit: limit,
            tags: tags
          };
          np.emit('@ApiList', [data, np.params]);
        },
        error: function(xhr, status) {
          np.emit('#AjaxError', ["Failed to load posts", xhr, status]);
        }
      });
    }
  };
  $.extend(np.api, api);

  // render the posts list with content
  np.on('@ApiList', function(event, data, params) {
    var tpl = np.postTpl;
    // keep the original content (markdown)
    np.data.posts = data.posts;
    var posts = [];
    $.each(data.posts, function(idx, post) {
      var tmp = {};
      tmp._id = post._id;
      if (post.content) {
        tmp.content = np.showdown.makeHtml(post.content);
      }
      if (post.title) {
        tmp.title = post.title;
      }
      if (post.published) {
        tmp.published = np.formatDate(new Date(post.published));
      } else {
        tmp.draft = 'Draft: ' + new Date(post.created).toLocaleString();
      }

      if (post.hasOwnProperty("tags")) {
        tmp.tags = [];
        $.each(post.tags, function(idx, tag) {
          tmp.tags[idx] = {
            name: tag
          };
        });
      }
      posts.push(tmp);
    });
    //np.emit('PostContentBeforeMU', [tpl, views]); // event <=> hook ?
    var postsHTML = Mustache.to_html(tpl, {
      posts: posts
    });
    //np.emit('PostContentAfterMU', [tpl, views]);
    dom.posts.attr('innerHTML', postsHTML);
    // bind event to tags
    $('div.np-post-tags .np-post-tag').click(function(event) {
      if (params.tags.indexOf(event.currentTarget.innerHTML) < 0) {
        $.merge(params.tags, [event.currentTarget.innerHTML]);
        np.emit('TagSelected');
      }
    });
    $('.np-post-date').removeClass('np-hide');
    np.emit('PostsRendered', [data, params]);
  });

  np.on('TagSelected', buildTagsFilter);

  function buildTagsFilter(event) {
    var params = np.params;
    np.api.list({
      skip: params.skip || 0,
      limit:params.limit || 20,
      tags: params.tags || []
    });
    dom.filterTags.attr('innerHTML', '');
    $.each(params.tags, function(idx, tag) {
      dom.filterTags.prepend('<span class="s_nor np-filter-tag hand"><span class="sr"><a title="' + tag + '">' + tag + '</a><b>X</b></span></span>');
    });
    $('.np-filter-tag').click(
      function() {
        var tag = $(this).find('a').attr('title');
        params.tags = $.grep(params.tags, function(t) {
          return tag != t;
        });
        np.params = params;
        buildTagsFilter();
      }).hover(function handlerIn(e) {
        $(this).removeClass('s_nor');
        $(this).addClass('s_here');
      }, function out() {
        $(this).removeClass('s_here');
        $(this).addClass('s_nor');
      });
  }

  // build pager
  np.on('@ApiList', buildPager);
  function buildPager(event, data, params) {
    var postNum  = data.posts.length;
    if (postNum === params.limit) {
      dom.nextPage.unbind('click');
      dom.nextPage.bind('click', function() {
        params.skip += params.limit;
        np.api.list(params);
      });
      dom.nextPage.removeClass('np-hide');
    } else {
      dom.nextPage.addClass('np-hide');
    }
    if (params.skip > 0) {
      dom.prevPage.unbind('click');
      dom.prevPage.bind('click', function() {
        var skip = params.skip - params.limit;
        params.skip = skip > 0 ? skip : 0;
        np.api.list(params);
      });
      dom.prevPage.removeClass('np-hide');
    } else {
      dom.prevPage.addClass('np-hide');
    }
  }

  np.buildPager = buildPager;
}

function userJs($) {
  var postId, np = $.np, dom = np.dom;
  $.extend(np.api, {
    save: function(publish) {
      var post = {};
      post.title = dom.title.attr('value');
      post.tags = [];
      $.each(dom.tags.attr('value').split(','), function(idx, tag) {
        if (tag) post.tags.push($.trim(tag));
      });
      post.content = dom.input.attr('value');
      if (postId) post._id = postId;
      if (publish) {
        post.published = 1;
      }

      $.ajax({
        url: '/_api/blog/save/',
        type: 'POST',
        data: JSON.stringify(post),
        dataType: 'json',
        success: function(data) {
          np.emit('@ApiSave', [data, publish]);
        },
        error: function(xhr, status) {
          np.emit('#AjaxError', ["Failed to save post", xhr, status]);
        }
      });
    },
    remove: function(id) {
      $.ajax({
        url: '/_api/blog/remove/',
        type: 'POST',
        data: JSON.stringify({_id: id}),
        dataType: 'json',
        success: function(data) {
          np.emit('@ApiRemove', [data]);
        },
        error: function(xhr, status) {
          np.emit('#AjaxError', ["Failed to remove post", xhr, status]);
        }
      });
    }
  });
  np.on('@ApiRemove', function(event, data) {
    np.api.list();
    np.growl({
      title: 'Post removed',
      text: ' '
    });
  });
  np.on('@ApiSave', function(event, data, publish) {
    postId = data._id;
    np.growl({
      title: publish ? 'Published successfully' : 'Saved successfully',
      text: ' '
    });
    if (publish) {
      np.resetEditor();
      np.api.list(np.params);
    }
  });

  var lastContent;
  /**
   * convert markdown and show the converted in preview div
   *
   * @param {Object} input Input element (jQuery)
   * @param {Object} preview Preview element (jQuery)
   */
  np.preview = function(input, preview) {
    var content = input.attr('value');
    content = content === lastContent ? false : content;
    if (content !== false) {
      lastContent = content;
      preview.attr('innerHTML', np.showdown.makeHtml(content));
    }
  }

  np.resetEditor = function() {
    $.each([dom.title, dom.tags, dom.input], function(idx, item) {
      item.attr('value', '');
    });
    dom.previewDiv.attr('innerHTML', '');
    postId = null;
  }

  np.fillEditor = function(id) {
    function fill(data) {
      postId = id;
      dom.title.attr('value', data.title);
      dom.input.attr('value', data.content);
      dom.tags.attr('value', data.tags.join(','));
    }

    if (np.data.posts) {
      $.each(np.data.posts, function(idx, el) {
        if (el._id === postId) {
          fill(el);
        }
      });
    }
    $.ajax({
      url: '/_api/blog/id/' + id + '/',
      type: 'GET',
      dataType: 'json',
      success: function(data, status) {
        fill(data);
      },
      error: function(xhr, status) {
        np.emit("#AjaxError", ['Failed to load post', xhr, status])
      }
    });
  };

  np.removePost = function(id) {
    np.api.remove(id);
  };
}

function initJs($) {
  // store the jquery object for later usage
  var dom = $.np.dom;
  dom.filter = $('#np-filter'),
    dom.filterTags = $('#np-filter-tags'),
    dom.posts = $('#np-posts'),
    dom.tabComments = $('#np-tab-comments');
  // pager
  dom.nextPage = $('#np-next-page');
  dom.prevPage = $('#np-prev-page');
}

function initJsBindEvents($) {
  // bind events, insert date
  var np = $.np;
  $('.np-post-date').each(function(idx, npd) {
    if (npd.innerHTML.length > 0) {
      $(this)
        .attr('innerHTML', np.formatDate(new Date(npd.innerHTML)))
        .removeClass('np-hide');
    }
  });
  if (np.page == 'index') {
    $('div.np-post-tags .np-post-tag').click(function(event) {
      var params = np.params;
      params.tags = [event.currentTarget.innerHTML];
      np.emit('TagSelected');
    });
  }
  // mustache and markdown rendered by server
  np.buildPager(null, {
    posts: {length: np.postsCount}
  }, {
    limit: 20,
    skip: 0
  });
  np.emit('PostsRendered');
}


function initUserJs($) {
  var np = $.np;
  var dom = np.dom;
  // construct the tabs
  $("#np-tabs").tabs("div.np-tab", {
    history: true ,
    effect: 'default'
  });
  dom.tabs = $("#np-tabs").data('tabs'),
    // editor
    dom.title = $('#np-title'),
    dom.tags = $('#np-tags'),
    dom.input = $('#np-textarea'),
    dom.previewDiv = $('#np-preview'),
    dom.editor = $('.np-editor'),
    dom.save = $('#np-editor-save'),
    dom.cancel = $('#np-editor-cancel'),
    dom.publish = $('#np-editor-publish');
  function convert() {
    np.preview(dom.input, dom.previewDiv);
  }

  // convert once onload
  convert();
  // bind events
  dom.input.bind('input', function() {
    convert();
  });
  dom.save.click(function(event) {
    np.api.save();
  });
  dom.publish.click(function(event) {
    np.api.save(true);
  });
  dom.cancel.click(function(event) {
    np.resetEditor();
  });

  // after rendered post
  np.on('PostsRendered', function() {
    // add `edit` and `remove` button for author
    $('.np-post-info').append('<a href="#np-toolbar-editor" class="np-post-edit l">edit</a>');
    $('a.np-post-edit').bind('click', function(event) {
      var postId = $(this).parent('.np-post-info').attr('id');
      np.fillEditor(postId);
      np.dom.tabs.click(1);
    });
    $('.np-post-info').append('<a href="#" class="np-post-remove l">del</a>');
    $('a.np-post-remove').bind('click', function(event) {
      var postId = $(this).parent('.np-post-info').attr('id');
      np.removePost(postId);
    });
  });
}


script.addJsCode('js/main.js', mainJs, 'main');
script.addJsCode('js/user.js', userJs, 'user');
script.addJsCode('js/init.js', initJs, 'inline');
script.addJsCode('js/init.js', initJsBindEvents, 'inline');
script.addJsCode('js/initUser.js', initUserJs, 'inline');