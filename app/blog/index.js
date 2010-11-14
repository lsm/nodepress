var core = np,
fs = require('fs'),
Path = require('path'),
Collection = core.db.Collection,
factory = core.factory,
_now = core.util.now,
md5 = np.genji.util.crypto.md5;


factory.register('post', function(name) {return new Collection(name)}, ['posts'], true);
var post = factory.post;

post.extend({
    save: function(data, author) {
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data.hasOwnProperty('_id')) {
            data.created = new Date();
            data.author = author;
        } else {
            data.modified = new Date();
        }
        if (data.hasOwnProperty('published') && data.published == 1) {
            data.published = new Date();
        }
        return this._super(data);
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
    post.find({}).then(function(docs) {
        var chain = np.genji.pattern.control.chain;
        chain(docs, function(doc, idx, arr, next) {
            if (!(doc.published instanceof Date)) {
                var updateDoc = {
                    $set:{published: new Date(parseInt(doc.published)), created: new Date(doc.created)}
                };
                if (doc.modified) updateDoc['$set'].modified = new Date(parseInt(doc.modified));
                post.update({_id: doc._id}, updateDoc).then(next);
            } else {
                next();
            }
        })();
        chain(docs, function(doc, idx, arr, next) {
            if (typeof doc._id === 'string') {
                post.remove({_id: doc._id}).then(function() {
                    doc._id = new np.db.ObjectID;
                    post.save(doc).then(next);
                });
            } else {
                next();
            }
        })();
    });
});

// load post template from template file
fs.readFile(Path.join(core.view.viewRoot, '/share/posts.html'), 'utf8', function(err, data) {
    if (err) throw err;
    // nun use `{{&` to escape which is not compatible with original mustache
    data = data.replace('{{&content}}', '{{{content}}}');
    defaultContext.postTpl = data.split('\n').join('');
});




module.exports = {
    ctx: defaultContext,
    db: {
        post: post
    },
    client: require('./client'),
    api: require('./api'),
    view: require('./view'),
    DEFAULT_POST_NUM: 20
}