var fs = require('fs'),
  Path = require('path'),
  md5 = np.genji.md5;
var mongodb = require('mongodb-async').mongodb;

var post = np.db.collection('posts');

post.extend({
  save: function(data, author) {
    if (data) {
      if (data.hasOwnProperty('published') && data.published == 1) {
        data.published = new Date();
      }
      if (data.hasOwnProperty('_id')) {
        // old post
        var postId = new mongodb.ObjectID(data._id);
        data.modified = new Date();
        delete data._id;
        return this.update({_id: postId}, {$set: data});
      } else {
        // new post
        data.created = new Date();
        data.author = author;
        return this._super(data);
      }
    } else {
      throw new Error('invalid data');
    }
  }
});

var defaultContext = {
  staticUrl: np.script.staticUrl,
  cookieName: np.auth.cookieName
};

process.nextTick(function() {
  // load settings from db
  var setting = np.db.collection('settings'), cache = np.cache;
  setting.findOne({
    '_id': 'defaultTracker'
  }).then(function(trackerObj) {
      var tracker = trackerObj || {
        code: ''
      };
      cache.set('defaultTracker', tracker.code);
    });
  setting.findOne({
    '_id': 'site'
  }).then(function(site) {
      site = site || {};
      cache.set('title', site.title || 'Nodepress');
      cache.set('intro', site.intro || 'a blogging tool built on top of nodejs');
    });

  defaultContext.__defineGetter__('tracker', function() {
    return cache.get('defaultTracker');
  });
  defaultContext.__defineGetter__('title', function() {
    return cache.get('title');
  });
  defaultContext.__defineGetter__('intro', function() {
    return cache.get('intro');
  });
  // ensure indexes
  var postIndex = [
    ['published', -1],
    ['tags', 1],
    ['author', 1]
  ];
  post.ensureIndex(postIndex);
});

// load post template from template file
fs.readFile(Path.join(np.view.viewRoot, '/share/posts.html'), 'utf8', function(err, data) {
  if (err) throw err;
  // nun use `{{&` to escape which is not compatible with original mustache
  data = data.replace('{{&content}}', '{{{content}}}');
  defaultContext.postTpl = data.split('\n').join('');
});


require('./api');
require('./view');
require('./client');

module.exports = {
  ctx: defaultContext,
  DEFAULT_POST_NUM: 20
};