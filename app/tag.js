var core = np,
view = core.view,
client = core.client,
factory = core.factory,
management = require('./management'),
Collection = core.db.Collection,
settings = core.settings,
chain = np.genji.pattern.control.chain;

factory.register('tag', function(name) {return new Collection(name)}, ['tags'], true);
var tag = factory.tag;

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
    factory.post.find({"published": {$exists: true}}).then(function(docs) {
        if (docs) {
            docs.forEach(function(doc) {
                _buildTags(doc);
            });
            tag.giveDb(function(db) {
                db.createIndex("tags", [[["posts", 1]], [["count", 1]]], false, function() {});
            });
        }
    });
}

// bind to events
core.event.on("blog.api.save", _buildTags);
core.event.on("tag.rebuild", _rebuildTags);

// check if we need to rebuild the `tags` collection
tag.find({}).then(function(tags) {
    if (tags.length == 0) {
        core.event.emit("tag.rebuild");
    }
});

// api
function getTagCloud(handler) {
    tag.find({count: {$gt: 0}}, {"count": 1}, {sort: [['modified', -1]]}).then(function(tags) {
        handler.sendJSON(tags || {"error": "No tag foound"});
    });
}

var api = [
  ['tag/cloud/$', getTagCloud, "get"]
];


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
            innerHTML += '<div class="np-post-tag">' + tag._id + '</div>';
        });
        sidebar.attr("innerHTML", innerHTML);
        // bind event to tags
        var params = np.params;
        if (np.page == 'index') {
            $('#np-sidebar-tagcloud .np-post-tag').click(function(event) {
                if (!params.tags) params.tags = [];
                if (params.tags.indexOf(event.currentTarget.innerHTML) < 0) {
                    $.merge(params.tags, [event.currentTarget.innerHTML]);
                    np.emit('TagSelected', [params]);
                }
            });
        }
    });
}

function initJs($) {
    // get tags onload
    $.np.api.getTagCloud();
}


module.exports = {
    db: {tag: tag},
    client: {
        'main.js': {
            'app.tag': {
                weight: 100,
                code: mainJs
            }
        },
        'init.js': {
            'app.tag': {
                weight: 100,
                code: initJs
            }
        }
    },
    api: api
}