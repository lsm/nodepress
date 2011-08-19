var auth = np.auth,
  view = np.view,
  script = np.script,
  settings = np.settings;
var mongodb = require('mongodb-async').mongodb;
var ObjectID = mongodb.BSONPure.ObjectID;
var checkLogin = np.app.account.checkLogin;

var app = np.genji.app();

var post = np.db.collection('posts');
var user = np.db.collection('users');


var hasUser = false;

user.findOne({}).then(function(doc) {
  hasUser = !!doc;
});

function install(handler) {
  if (hasUser) return;
  handler.on('params', function(params) {
    if (params.username && params.password) {
      user
        .insert({username: params.username, password: np.auth.makePassword(params.password)})
        .then(function(userDocs) {
          if (Array.isArray(userDocs) && userDocs[0]._id) {
            hasUser = true;
            handler.redirect('/', false);
          }
        });
    } else {
      handler.error(200, 'Please fill username and password');
    }
  });
}

app.post('^/blog/install$', install);


function installed(handler) {
  if (!hasUser) {
    var ctx = np.app.blog.ctx;
    var scriptGroups = ["main"];
    ctx.scripts = [
      {js: script.getJsTags(scriptGroups), css: script.getCssTags(scriptGroups)}
    ];
    view.render('installation.html', ctx, function(html) {
      handler.sendHTML(html);
    });
  }
  return hasUser;
}

function index(handler) {
  if (!installed(handler)) return;

  var ctx = np.app.blog.ctx;
  var scriptGroups = ["main"];
  var inDev = settings.env === "development";
  if (checkLogin(handler, null)) {
    ctx.is_owner = [
      {name: handler.username}
    ];
    scriptGroups.push("user");
  } else {
    ctx.is_owner = undefined;
  }

  ctx.scripts = [
    {js: script.getJsTags(scriptGroups), css: script.getCssTags(scriptGroups)}
  ];
  // compress if not in dev model
  ctx.initJs = script.getScript('js/init.js', !inDev).code;
  ctx.initUserJs = script.getScript('js/initUser.js', !inDev).code;
  var query = {};
  if (!ctx.is_owner) {
    query.published = {$exists: true};
  }
  post.find(query, {
    limit: np.app.blog.DEFAULT_POST_NUM,
    sort:{"published": -1}
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
          if (!item.published) {
            item.draft = 'Draft: ' + new Date(item.created).toLocaleString();
          }
          // render markdown on server side for first page load
          item.content = view.markdown(item.content);
        }
      });
      ctx.posts = posts;
      ctx.page = 'index';
      ctx.postsCount = posts.length;
      view.render('index.html', ctx, function(html) {
        handler.sendHTML(html);
      });
    });
}

function article(handler, id) {
  var ctx = np.app.blog.ctx;
  if (checkLogin(handler, null)) {
    ctx.is_owner = [
      {name: handler.username}
    ];
  }
  post.findOne({
    _id: new ObjectID(id)
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
          post.content = view.markdown(post.content);
        }
        ctx.posts = [post];
        ctx.page = 'article';
        view.render('article.html', ctx, null, function(html) {
          handler.sendHTML(html);
        });
      } else {
        handler.error(404, 'Article not found');
      }
    });
}

app.mount([
  ['^/$', index, 'get'],
  ['^/article/([0-9a-zA-Z]{24})/.*/$', article, 'get'],
  ['.*', function(handler) {
    view.render('error/404.html', {url: this.request.url}, function(html) {
      handler.error(404, html);
    })
  }, 'notfound']
]);