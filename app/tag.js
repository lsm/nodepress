var view = np.view,
  management = require('./management'),
  settings = np.settings,
  chain = np.genji.chain;

var tag = np.db.collection('tags');
var post = np.db.collection('posts');

var api = np.genji.app('api', {root: '^/_api/'});

tag.extend({
  save: function(data) {
    data.modified = new Date;
    return this._super(data);
  }
});

// event handlers
function _buildTags(doc) {
  if (Array.isArray(doc.tags) && doc.published) {
    if (doc.modified) {
      // old post, find out if we've removed some tags
      tag.find({"posts": {"$in": [doc._id]}}).then(function(tagsFound) {
        if (tagsFound) {
          // iterate tag mapping posts, using `chain` to simulate blocked db operation
          chain(tagsFound, function(t, idx, arr, next) {
            if (doc.tags.indexOf(t._id) == -1) {
              // tag not found in current post.tags, remove the post id from that tag
              t.posts = t.posts.splice(t.posts.indexOf(doc._id), 1);
              // and save it
              t.count = t.posts.length;
              tag.save(t).then(next);
            } else {
              next();
            }
          });
        }
      });
    }
    // iterate post mapping tags
    chain(doc.tags, function(t, idx, arr, next) {
      tag.findOne({_id: t}).then(function(tagFound) {
        if (!tagFound) {
          // this is a new tag
          tag.save({_id:t, posts:[doc._id], count: 1}).then(next);
        } else {
          if (tagFound.posts.indexOf(doc._id) == -1) {
            // post not marked in current tag
            tagFound.posts.push(doc._id);
            tagFound.count = tagFound.posts.length;
            tag.save(tagFound).then(next);
          } else {
            next();
          }
        }
      });
    })();
  }
}

function _rebuildTags() {
  // get all published posts
  post.find({"published": {$exists: true}}).then(function(docs) {
    if (docs) {
      docs.forEach(function(doc) {
        _buildTags(doc);
      });
      tag.ensureIndex([
        ["posts", 1],
        ["count", 1]
      ]);
    }
  });
}

// bind to events
np.on("blog.api.save", _buildTags);
np.on("tag.rebuild", _rebuildTags);

// check if we need to rebuild the `tags` collection
tag.find({}).then(function(tags) {
  if (tags.length == 0) {
    np.emit("tag.rebuild");
  }
});

// api
function getTagCloud(handler) {
  tag.find({count: {$gt: 0}}, {"count": 1}, {sort: [
    ['modified', -1]
  ]}).then(function(tags) {
    handler.sendJSON(tags || {"error": "No tag foound"});
  });
}

api.mount([
  ['tag/cloud/$', getTagCloud, "get"]
]);


// client side code

function mainJs($) {
  // extend the rest api
  var np = $.np;
  $.extend(np.api, {
    getTagCloud: function() {
      var url = "/_api/tag/cloud/";
      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        success: function(data, status) {
          np.emit('@ApiTagCloud', [data]);
        },
        error: function(xhr, status) {
          np.emit('#AjaxError', ["Failed to load tag cloud", xhr, status]);
        }
      });
    }
  });

  np.on("@ApiTagCloud", function(event, data) {
    if (data.error) return;
    var sidebar = $("#np-sidebar-tagcloud");
    var innerHTML = "";
    data.forEach(function(tag) {
      innerHTML += '<a href="#" class="f18 np-post-tag">' + tag._id + '</a>';
    });
    sidebar.attr("innerHTML", innerHTML);
    // bind event to tags
    var params = np.params;
    if (np.page == 'index') {
      sidebar.find('.np-post-tag').click(function(event) {
        if (!params.tags) params.tags = [];
        var tag = event.currentTarget.innerHTML, idx = params.tags.indexOf(tag);
        if (idx < 0) {
          // let's add the tag as a parameter
          $.merge(params.tags, [tag]);
        } else {
          // remove it
          params.tags = $.grep(params.tags, function(t) {
            return tag != t;
          });
        }
        np.params = params;
        np.emit('TagSelected');
      });
    }
  });
}

function initJs($) {
  // get tags onload
  $.np.page == 'index' && $.np.api.getTagCloud();
}

np.script.addJsCode('js/main.js', mainJs, 'main');
np.script.addJsCode('js/init.js', initJs, 'inline');