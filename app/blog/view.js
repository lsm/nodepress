var auth = np.auth,
  view = np.view,
  script = np.script,
  settings = np.settings;

var app = np.genji.app();

var post = np.db.collection('posts');


function index(handler) {
  var user = auth.checkCookie(handler.getCookie(auth.cookieName), auth.cookieSecret)[0];
  var ctx = np.app.blog.ctx;
  var scriptGroups = ["main"];
  var inDev = settings.env == "development";
  if (user) {
    ctx.is_owner = [
      {
        name: user
      }
    ];
    scriptGroups.push("user");
  } else {
    ctx.is_owner = undefined;
  }

  ctx.scripts = [
    {js: script.getJsTags(scriptGroups), css: script.getCssTags(scriptGroups)}
  ];
  // compress if not in dev model
  ctx.initJs = script.getJsCode('js/init.js', !inDev);
  ctx.initUserJs = script.getJsCode('js/initUser.js', !inDev);
  post.count({}).then(function(num) {
    ctx.total = num;
    post.find({}, null, {
      limit: np.app.blog.DEFAULT_POST_NUM,
      sort:[
        ["published", -1]
      ]
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
          handler.sendHTML(html);
        });
      });
  });
}

function article(handler, id) {
  var user = auth.checkCookie(handler.getCookie(auth.cookieName), auth.cookieSecret)[0];
  var ctx = np.app.blog.ctx;
  if (user) {
    ctx.is_owner = [
      {
        name: user
      }
    ];
  } else {
    ctx.is_owner = undefined;
  }
  post.count({}).then(function(num) {
    ctx.total = num;
    post.findOne({
      _id: new mongodb.ObjectID(id)
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
  });
}

app.mount([
  ['^/$', index, 'get'],
  ['^/article/([0-9a-zA-Z]{24})/.*/$', article, 'get'],
  ['.*', function(handler) {
    view.render('error/404.html', {url: handler.request.url}, function(html) {
      handler.error(404, html);
    })
  }, 'notfound']
]);