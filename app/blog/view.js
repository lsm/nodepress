    
var core = require('../../core'),
auth = core.auth,
view = core.view,
client = core.client,
factory = core.factory,
post = factory.post,
settings = genji.settings;


function index() {
    var self = this;
    var user = auth.checkCookie(self, settings.cookieSecret)[0];
    var ctx = core.defaultContext;
    var scriptGroup = ["main"];
    var inDev = settings.env.type == "development";
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
    var user = auth.checkCookie(self, settings.cookieSecret)[0];
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
    }, {pre: [auth.checkLogin]}],
    ['^/$', index, 'get'],
    ['^/article/(\\w+)/.*/$', article, 'get'],
    ['.*', function() {
        var self = this;
        view.render('/views/error/404.html', {url: this.request.url}, function(html) {
            self.error(404, html);
        })
    }, 'notfound']
];