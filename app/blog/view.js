var core = np,
auth = core.auth,
view = core.view,
client = core.client,
account = require('../account'),
factory = core.factory,
post = factory.post,
settings = core.settings;


function index() {
    var self = this;
    var user = auth.checkCookie(this.getCookie(auth.cookieName), auth.cookieSecret)[0];
    var ctx = core.app.blog.ctx;
    var scriptGroup = ["main"];
    var inDev = settings.env == "development";
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
            limit: core.app.blog.DEFAULT_POST_NUM,
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
                    // render markdown on server side for first page load
                    item.content = view.markdown(item.content);
                }
            });
            ctx.posts = posts;
            ctx.page = 'index';
            view.render('index.html', ctx, function(html) {
                self.sendHTML(html);
            });
        });
    });
}

function article(id) {
    var self = this;
    var user = auth.checkCookie(this.getCookie(auth.cookieName), auth.cookieSecret)[0];
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
                view.render('article.html', ctx, null, function(html) {
                    self.sendHTML(html);
                });
            } else {
                self.error(404, 'Article not found');
            }
        });
    });
}

module.exports = [
    ['^/hello/', function() {
        this.sendHTML('Hello World\n');
    }, {pre: [account.checkLogin]}],
    ['^/$', index, 'get'],
    ['^/article/(\\w+)/.*/$', article, 'get'],
    ['.*', function() {
        var self = this;
        view.render('error/404.html', {url: this.request.url}, function(html) {
            self.error(404, html);
        })
    }, 'notfound']
];