;
(function($) {
    // setup
    $.np = {};
    var emitter = $.np.emitter = $({});
    var showdown = $.np.showdown = new Showdown.converter();
    var tpl = $.np.tpl = {
        posts: '{{#posts}}<div id="{{id}}" class="np-post"><h2 class="np-post-title">{{title}}</h2>'
    +'<div class="np-post-info np-right"><h4 class="np-post-date">{{published}}</h4></div>'
    +'<div class="np-post-content">{{{content}}}</div>'
    +'<div class="np-post-tags np-right">{{#tags}}<div class="np-post-tag">{{name}}</div>{{/tags}}</div></div>{{/posts}}'
    };
    $.np.data = {};
    var growl = $.gritter.add;
    
    var postId, published, created, params = {}, np;

    $.np.init = function() {
        np = $.np.dom;
    },

    $.np.setPostId = function(id) {
        postId = id;
    }

    // rest apis and remote calls
    var api = {
        list: function(query) {
            params = query || params;
            var skip = params.skip || 0;
            var limit = params.limit || 5;
            var tags = params.tags || [];
            var url = '/_api/list/' + skip + '/' + limit + '/';
            if (tags.length > 0) {
                url += tags.join(',') + '/';
            }
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json',
                success: function(data, status) {
                    params = {
                        skip: skip,
                        limit: limit,
                        tags: tags
                    };
                    emitter.trigger('@ApiList', [data, params]);
                },
                error: function(xhr, status) {
                    emitter.trigger('#ApiList', [xhr, status]);
                }
            });
        },
        save: function(publish) {
            var post = {};
            post.title = np.title.attr('value');
            post.tags = [];
            $.each(np.tags.attr('value').split(','), function(idx, tag) {
                if (tag) post.tags.push($.trim(tag));
            });
            post.content = np.input.attr('value');
            if (postId) post._id = postId;
            if (publish) {
                post.published = 1;
            }
            if (published) {
                // already published post
                post.published = published;
                post.created = created;
            }

            $.ajax({
                url: '/_api/save/post/',
                type: 'POST',
                data: JSON.stringify(post),
                dataType: 'json',
                success: function(data) {
                    emitter.trigger('@ApiSave', [data, publish]);
                },
                error: function(xhr, status) {
                    emitter.trigger('#ApiSave', [xhr, status]);
                }
            });
        },

        getTracker: function() {
            $.ajax({
                url: '/_api/get/tracker/',
                type: 'GET',
                dataType: 'text',
               success: function(data) {
                    emitter.trigger('@ApiGetTracker', [data]);
                },
                error: function(xhr, status) {
                    emitter.trigger('#ApiGetTracker', [xhr, status]);
                }
            });
        },

        saveTracker: function() {
           $.ajax({
                url: '/_api/save/tracker/',
                type: 'POST',
                data: np.tracker.attr('value'),
                dataType: 'json',
                success: function(data) {
                    emitter.trigger('@ApiSaveTracker');
                },
                error: function(xhr, status) {
                    emitter.trigger('#ApiSaveTracker', [xhr, status]);
                }
            });
        }

    };
    $.np.api = api;
    
    $.np.signIn = function() {
        $.ajax({
            url: '/signin/',
            type: 'POST',
            dataType: 'text',
            data: {
                username: np.username.attr('value'),
                password: np.password.attr('value')
            },
            success: function(data) {
                emitter.trigger('@Login', [data]);
            },
            error: function(xhr, status) {
                emitter.trigger('#Login', [xhr, status]);
            }
        });
    }

    // events
    emitter.bind('@Login', function(event, data) {
        location.href = '/';
    });
    emitter.bind('#Login', function(event, xhr, status) {
        $.gritter.add({
            title: "Failed to sign in",
            time: 3000,
            text: xhr.responseText
        });
    });

    // render the posts list with content
    emitter.bind('@ApiList', function(event, data, params) {
        var tpl = $.np.tpl.posts;
        // keep the original content (markdown)
        $.np.data.posts = data.posts;
        var posts = [];
        $.each(data.posts, function(idx, post) {
            var tmp = {};
            tmp.id = post._id;
            if (post.content) {
                tmp.content = $.np.showdown.makeHtml(post.content);
            }
            if (post.title) {
                tmp.title = post.title;
            }
            tmp.published = new Date(parseInt(post.published)).toLocaleDateString();
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
        //emitter.trigger('PostContentBeforeMU', [tpl, views]); // event <=> hook ?
        var postsHTML = Mustache.to_html(tpl, {
            posts: posts
        });
        //emitter.trigger('PostContentAfterMU', [tpl, views]);
        np.posts.attr('innerHTML', postsHTML);
        // bind event to tags
        $('.np-post-tag').click(function(event) {
            if (params.tags.indexOf(event.currentTarget.innerHTML) < 0) {
                $.merge(params.tags, [event.currentTarget.innerHTML]);
                emitter.trigger('TagSelected', [params]);
            }
        });
        emitter.trigger('PostsRendered', [data, params]);
    });

    emitter.bind('@ApiSave', function(event, data, publish) {
        postId = data._id;
        growl({
            title: publish ? 'Published successfully' : 'Saved successfully',
            text: ' '
        });
        if (publish) {
            $.np.resetEditor();
            api.list(params);
        }
    });

    emitter.bind('TagSelected', buildTagsFilter);

    function buildTagsFilter(event, params) {
        api.list({skip:0, limit:5, tags:params.tags});
        np.filterTags.attr('innerHTML', '');
        $.each(params.tags, function(idx, tag) {
            np.filterTags.prepend('<div class="np-filter-tag">'+ tag +'</div>');
        });
        $('#np-filter-tags div').click(function(event) {
            var tag = event.currentTarget.innerHTML;
            params.tags = $.grep(params.tags, function(t) {
                return tag != t;
            });
            buildTagsFilter(event, params);
        });
    }

    // build pager
    emitter.bind('@ApiList', buildPager);
    function buildPager(event, data, params) {
        var total = data.total;
        $('#np-post-perpage a').each(function(idx, a) {
            a = $(a);
            var perPage = parseInt(a.attr('innerHTML'));
            if (perPage == params.limit || perPage - total > 10) {
                a.addClass('np-hide');
            } else {
                a.unbind('click');
                a.bind('click', function() {
                    params.limit = perPage;
                    api.list(params);
                });
                a.removeClass('np-hide');
            }
        });
        if (params.skip + params.limit < total) {
            np.nextPage.unbind('click');
            np.nextPage.bind('click', function() {
                params.skip += params.limit;
                api.list(params);
            });
            np.nextPage.removeClass('np-hide');
        } else {
            np.nextPage.addClass('np-hide');
        }
        if (params.skip > 0) {
            np.prevPage.unbind('click');
            np.prevPage.bind('click', function() {
                var skip = params.skip - params.limit;
                params.skip = skip > 0 ? skip : 0;
                api.list(params);
            });
            np.prevPage.removeClass('np-hide');
        } else {
            np.prevPage.addClass('np-hide');
        }
        
    }

    emitter.bind('@ApiGetTracker', function(e, data) {
        np.tracker.attr('value', data);
    });

    var lastContent;
    /**
     * convert markdown and show the converted in preview div
     *
     * @param {Object} input Input element (jQuery)
     * @param {Object} preview Preview element (jQuery)
     * @param {Object} showdown Instance of showdown
     */
    $.np.preview = function(input, preview) {
        var content = input.attr('value');
        content = content === lastContent ? false : content;
        if (content !== false) {
            lastContent = content;
            preview.attr('innerHTML', $.np.showdown.makeHtml(content));
        }
    }

    $.np.resetEditor = function() {
        $.each([np.title, np.tags, np.input], function(idx, item) {
            item.attr('value', '');
        });
        np.previewDiv.attr('innerHTML', '');
        postId = null;
    }

    $.np.fillEditor = function(id) {
        $.each($.np.data.posts, function(idx, el) {
            postId = id;
            if (el._id === postId) {
                published = el.published;
                created = el.created;
                np.title.attr('value', el.title);
                np.input.attr('value', el.content);
                np.tags.attr('value', el.tags.join(','));
            }
        });
    }

})(jQuery);
