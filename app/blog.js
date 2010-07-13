var db = require('../core/db'),
auth = require('../core/auth'),
management = require('./management'),
view = require('../core/view'),
Collection = db.Collection,
settings = genji.settings,
md5 = genji.crypto.md5;

function _now() {
    return (new Date()).getTime() + ''; // save as string
}

var post = new Collection('posts');
post.extend({
    save: function(data) {
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data.hasOwnProperty('_id')) {
            data.created = _now();
            data._id = md5(data + data.created);
        } else {
            data.modified = _now();
        }
        if (data.hasOwnProperty('published') && data.published == 1) {
            data.published = _now();
        }
        return this._super(data);
    }
});

function save(handler) {
    handler.on('end', function(data) {
        post.save(data).then(function(doc) {
            handler.sendJSON({
                _id: doc._id
            });
        });
    });   
}

function list(handler, skip, limit, tags) {
    skip = parseInt(skip) ? skip : 0;
    limit = parseInt(limit) ? limit : 5;
    if (limit > 30 || limit < 1) limit = 5; // default
    var query = {
        published: {
            $exists: true
        }
    };

    if (tags) {
        tags = decodeURIComponent(tags).split(',');
        query.tags = {
            $all: tags
        };
    }

    var options = {
        sort:[["published", -1]],
        limit:limit,
        skip: skip
    }

    post.count(query).then(function(num) {
        post.find(query, null, options).then(function(result) {
            handler.sendJSON({
                posts: result,
                total: num
            });
        });
    });
}

var api = [
['blog/save/', save, 'post', [auth.checkLogin]],
['blog/list/([0-9]+)/([0-9]+)/(.*)/$', list, 'get'],
['blog/list/([0-9]+)/([0-9]+)/$', list, 'get'],
['blog/list/$', list, 'get']
];

var ctx = {
    staticUrl: settings.staticUrl,
    debugUrl: settings.env.type === 'development' ? '/debug' : '',
    cookieName: settings.cookieName,
    title: 'Nodepress.com',
    intro: 'a blogging tool built on top of nodejs',
    tplPost: '{{#posts}}<div id="{{_id}}" class="np-post"><h2 class="np-post-title"><a href="/article/{{_id}}/{{title}}/">{{title}}</a></h2>'
    +'<div class="np-post-info np-right"><h4 class="np-post-date">{{published}}</h4></div>'
    +'<div class="np-post-content">{{{content}}}</div>'
    +'<div class="np-post-tags np-right">{{#tags}}<div class="np-post-tag">{{name}}</div>{{/tags}}</div></div>{{/posts}}'
};

function index(handler) {
    var user = auth.checkCookie(handler, settings.cookieSecret)[0];
    if (user) {
        ctx.is_owner = [{
            name: user
        }];
    } else {
        ctx.is_owner = undefined;
    }
    management.getTracker(null, function(tracker) {
        ctx.tracker = tracker.code;
        post.count({}).then(function(num) {
            ctx.total = num;
            post.find({}, null, {
                limit: 5,
                sort:[["published", -1]]
            }).then(function(posts) {
                posts.forEach(function(item) {
                    if (item.hasOwnProperty("tags")) {
                        var tags = [];
                        for (var i = 0; i < item.tags.length; i++) {
                            tags[i] = {
                                name: item.tags[i]
                            };
                        }
                        item.tags = tags;
                    }
                });
                ctx.posts = posts;
                ctx.page = 'index';
                view.render('/views/index.html', ctx, null, function(html) {
                    handler.sendHTML(html);
                });
            });
        });
    });

}

function article(handler, id, title) {
    management.getTracker(null, function(tracker) {
        ctx.tracker = tracker.code;
        post.count({}).then(function(num) {
            ctx.total = num;
            post.findOne({
            _id: id
        }).then(function(post) {
            if (post) {
                if (post.hasOwnProperty("tags")) {
                    var tags = [];
                    for (var i = 0; i < post.tags.length; i++) {
                        tags[i] = {
                            name: post.tags[i]
                        };
                    }
                    post.tags = tags;
                }
                ctx.posts = [post];
                ctx.page = 'article';
                view.render('/views/article.html', ctx, null, function(html) {
                    handler.sendHTML(html);
                });
            } else {
                handler.error(404, 'Article not found');
            }
        });
    });
    });
}

var _view = [
['^/$', index, 'get'],
[/^\/article\/(\w+)\/.*\/$/, article, 'get']
];


module.exports = {
    db: {
        post: post
    },
    api: api,
    view: _view
}