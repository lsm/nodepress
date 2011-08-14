fs = require('fs'),
Path = require('path'),
md5 = np.genji.md5;

var post = np.db.collection('posts');

post.extend({
    save: function(data, author) {
        if (data) {
            if (data.hasOwnProperty('published') && data.published == 1) {
                data.published = new Date();
            }
            if (data.hasOwnProperty('_id')) {
                // old post
                var postId = new core.db.ObjectID(data._id);
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
    staticUrl: core.client.staticUrl,
    cookieName: core.auth.cookieName
};

process.nextTick(function() {
    // load settings from db
    var setting = core.db.setting, cache = core.cache;
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
        ['published', -1], ['tags', 1], ['author', 1]
    ];
    post.ensureIndex(postIndex);
});

// load post template from template file
fs.readFile(Path.join(core.view.viewRoot, '/share/posts.html'), 'utf8', function(err, data) {
    if (err) throw err;
    // nun use `{{&` to escape which is not compatible with original mustache
    data = data.replace('{{&content}}', '{{{content}}}');
    defaultContext.postTpl = data.split('\n').join('');
});


require('./api');
require('./view');

module.exports = {
    ctx: defaultContext,
    client: require('./client'),
    DEFAULT_POST_NUM: 20
}