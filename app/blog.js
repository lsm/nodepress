var core = require('../core'),
db = core.db,
auth = core.auth,
view = core.view,
client = core.client,
factory = core.factory,
management = require('./management'),
Collection = db.Collection,
settings = genji.settings,
path = require("path"),
_now = core.util.now,
md5 = genji.crypto.md5;


factory.register('post', function(name) {
    return new Collection(name)
    }, ['posts'], true);
var post = factory.post;
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

// api
function save(handler) {
    handler.on('end', function(data) {
        post.save(data).then(function(doc) {
            handler.sendJSON({
                _id: doc._id
            });
            core.event.emit('blog.api.save', doc);
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
            core.event.emit('blog.api.list', query, options, result);
        });
    });
}

function byId(handler, id) {
    post.findOne({
        _id: id
    }).then(function(data) {
        handler.sendJSON(data);
        core.event.emit('blog.api.id', id, data);
    });
}

var api = [
['blog/save/', save, 'post', [auth.checkLogin]],
['blog/list/([0-9]+)/([0-9]+)/(.*)/$', list, 'get'],
['blog/list/([0-9]+)/([0-9]+)/$', list, 'get'],
['blog/list/$', list, 'get'],
['blog/id/([0-9a-fA-F]+)/$', byId, 'get']
];

// add scripts
// js
[
{type: "js", basename: "jquery-1.4.2.js", group: "main"},
{type: "js", basename: "jquery.gritter-1.6.js", group: "main"},
{type: "js", basename: "jquery.tools.tabs-1.2.4.js", group: "main"},
{type: "js", basename: "mustache-0.3.0.js", group: "main"},
{type: "js", basename: "showdown-0.9.js", group: "main"},
{type: "js", basename: "main.js", group: "main"},
{type: "js", basename: "user.js", group: "user"}
].forEach(function(script) {
    client.addScript(script.type, script.basename, "/static/js/", "/js/", script.group);
});
// css
[
{type: "css", basename: "screen.css", group: "main"},
{type: "css", basename: "jquery.gritter.css", group: "main"},
{type: "css", basename: "tabs.css", group: "user"}
].forEach(function(script) {
    client.addScript(script.type, script.basename, "/static/css/", "/css/", script.group);
});

// views
function index(handler) {
    var user = auth.checkCookie(handler, settings.cookieSecret)[0];
    var ctx = core.defaultContext;
    var scriptGroup = ["main"];
    var inDev = settings.env.type == "development1";
    if (user) {
        ctx.is_owner = [{
            name: user
        }];
        scriptGroup.push("user");
    } else {
        ctx.is_owner = undefined;
    }
    // combine if not in dev model
    ctx.scripts = [{js: client.getScripts("js", scriptGroup, !inDev), css: client.getScripts("css", scriptGroup, !inDev)}]
    // compress if not in dev model
    ctx.initJs = client.getCode('init.js', !inDev),
    ctx.initUserJs = client.getCode('initUser.js', !inDev),
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
}

function article(handler, id) {
    var user = auth.checkCookie(handler, settings.cookieSecret)[0];
    var ctx = core.defaultContext;
    if (user) {
        ctx.is_owner = [{
            name: user
        }];
    } else {
        ctx.is_owner = undefined;
    }
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
}

var _view = [
['^/$', index, 'get'],
['^/article/(\\w+)/.*/$', article, 'get']
];

// client side code
function mainJs($) {
    var np = $.np;
    np.showdown = new Showdown.converter();
    np.data = {};
    np.tpl = {
        posts: '{{#posts}}<div id="{{_id}}" class="np-post"><h2 class="np-post-title"><a href="/article/{{_id}}/{{title}}/">{{title}}</a></h2>'
    +'<div class="np-post-info np-right"><h4 class="np-post-date">{{published}}</h4></div>'
    +'<div class="np-post-content">{{{content}}}</div>'
    +'<div class="np-post-tags np-right">{{#tags}}<div class="np-post-tag">{{name}}</div>{{/tags}}</div></div>{{/posts}}'
    };
    var dom = np.dom;
    // rest apis and remote calls
    var api = {
        list: function(query) {
            np.params = query || np.params;
            var skip = np.params.skip || 0;
            var limit = np.params.limit || 5;
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
        var tpl = np.tpl.posts;
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
        //np.emit('PostContentBeforeMU', [tpl, views]); // event <=> hook ?
        var postsHTML = Mustache.to_html(tpl, {
            posts: posts
        });
        //np.emit('PostContentAfterMU', [tpl, views]);
        dom.posts.attr('innerHTML', postsHTML);
        // bind event to tags
        $('.np-post-tag').click(function(event) {
            if (params.tags.indexOf(event.currentTarget.innerHTML) < 0) {
                $.merge(params.tags, [event.currentTarget.innerHTML]);
                np.emit('TagSelected', [params]);
            }
        });
        np.emit('PostsRendered', [data, params]);
    });

    np.on('TagSelected', buildTagsFilter);

    function buildTagsFilter(event) {
        var params = np.params;
        np.api.list({
            skip: params.skip || 0,
            limit:params.limit || 0,
            tags: params.tags || []
        });
        dom.filterTags.attr('innerHTML', '');
        $.each(params.tags, function(idx, tag) {
            dom.filterTags.prepend('<div class="np-filter-tag">'+ tag +'</div>');
        });
        $('#np-filter-tags div').click(function(event) {
            var tag = event.currentTarget.innerHTML;
            params.tags = $.grep(params.tags, function(t) {
                return tag != t;
            });
            np.params = params;
            buildTagsFilter(event);
        });
    }

    // build pager
    np.on('@ApiList', buildPager);
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
                    np.api.list(params);
                });
                a.removeClass('np-hide');
            }
        });
        if (params.skip + params.limit < total) {
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

function blogMainUser($) {
    var postId, published, created, np = $.np, dom = np.dom;
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
            if (published) {
                // already published post
                post.published = published;
                post.created = created;
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
        }
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
            published = data.published;
            created = data.created;
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
    }
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

module.exports = {
    db: {
        post: post
    },
    client: {
        'main.js': {
            'app.blog': {
                weight: 20,
                code: mainJs
            }
        },
        'user.js': {
            'app.blog.mainUser': {
                weight: 30,
                code: blogMainUser
            }
        },
        'init.js' : {
            'app.blog': {
                weight: 20,
                code: initJs
            },
            'app.blog.renderPost': {
                weight: 40,
                code: function($) {
                    // render content/pager, bind events
                    var np = $.np;
                    $('.np-post-content').each(function(idx, npc) {
                        npc.innerHTML = np.showdown.makeHtml(npc.innerHTML);
                    });
                    $('.np-post-date').each(function(idx, npd) {
                        npd.innerHTML = new Date(parseInt(npd.innerHTML)).toLocaleDateString();
                    });
                    if (np.page == 'index') {
                        $('.np-post-tag').click(function(event) {
                            var params = np.params;
                            params.tags = [event.currentTarget.innerHTML];
                            np.np.emit('TagSelected', [params]);
                        });
                    }
                    if (np.totalPosts != '') {
                        // mustache rendered by server
                        np.buildPager(null, {
                            total: parseInt(np.totalPosts)
                        }, {
                            limit: 5,
                            skip: 0
                        });
                        np.emit('PostsRendered');
                    }
                }
            }
        },
        'initUser.js': {
            'app.blog.initUser': {
                weight: 30,
                code: function($) {
                    var np = $.np;
                    var dom = np.dom;
                    dom.tabs = $("#np-tabs").tabs("div.np-tab", {
                        history: true ,
                        effect: 'default'
                    }),
                    // editor
                    dom.title = $('#np-title'),
                    dom.tags = $('#np-tags'),
                    dom.input = $('#np-textarea'),
                    dom.previewDiv = $('#np-preview'),
                    dom.editor = $('.np-editor'),
                    dom.save = $('#np-save'),
                    dom.publish = $('#np-publish');
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

                    // after rendered post
                    np.on('PostsRendered', function() {
                        $('div.np-post-info').append('<a href="#np-toolbar-editor" class="np-post-edit np-left">edit</a>');
                        $('a.np-post-edit').bind('click', function(event) {
                            var postId = $(event.currentTarget).parent('.np-post-info').parent('.np-post').attr('id');
                            np.fillEditor(postId);
                        });
                    });
                }
            }
        }
    },
    api: api,
    view: _view
}