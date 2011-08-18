var account = require('../account');
var auth = np.auth;
var mongodb = require('mongodb-async').mongodb;
var ObjectID = mongodb.BSONPure.ObjectID;
var checkLogin = np.app.account.checkLogin;

var api = np.genji.app('api', {root: '^/_api/'});
var post = np.db.collection('posts');

function save(handler) {
  handler.on('json', function(doc, raw) {
    post.save(doc, handler.username).and(
      function(defer, doc) {
        handler.sendJSON({
          _id: doc._id
        });
        np.emit('blog.api.save', doc);
      }).fail(function(err) {
        console.log(err.stack);
      });
  });
}

function remove(handler) {
  handler.on('json', function(doc, data) {
    post.remove({_id: new ObjectID(doc._id)}).then(function(docRemoved) {
      handler.sendJSON({});
      np.emit('blog.api.remove', doc);
    });
  });
}

function list(handler, skip, limit, tags) {
  skip = parseInt(skip, 10);
  skip = skip ? skip : 0;
  limit = parseInt(limit, 10);
  limit = limit ? limit : np.app.blog.DEFAULT_POST_NUM;
  if (limit > 30 || limit < 1) limit = np.app.blog.DEFAULT_POST_NUM; // default
  var query = {};
  if (checkLogin(handler, null)) {
    query.published = {$exists: true};
  }

  if (tags) {
    tags = decodeURIComponent(tags).split(',');
    query.tags = {
      $in: tags
    };
  }

  var options = {
    sort:{"published": -1},
    limit:limit,
    skip: skip
  };

  post.find(query, options).then(function(result) {
    handler.sendJSON({posts: result});
    np.emit('blog.api.list', query, options, result);
  });
}

function byId(handler, id) {
  post.findOne({
    _id: new ObjectID(id)
  }).then(function(data) {
      handler.sendJSON(data);
      np.emit('blog.api.id', id, data);
    });
}

api.mount([
  ['blog/save/$', [account.checkLogin, save], 'post'],
  ['blog/remove/$', [account.checkLogin, remove], 'post'],
  ['blog/list/([0-9]+)/([0-9]+)/(.*)/$', list, 'get'],
  ['blog/list/([0-9]+)/([0-9]+)/$', list, 'get'],
  ['blog/list/$', list, 'get'],
  ['blog/id/([0-9a-fA-F]{24})/$', byId, 'get']
]);