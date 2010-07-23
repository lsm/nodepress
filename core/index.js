// exports modules
var Buffer = require('buffer').Buffer;
exports.auth = require('./auth'),
exports.db = require('./db'),
exports.client = require('./client'),
exports.promise = require('./promise'),
settings = genji.settings,
exports.view = require('./view');

// nodepress global object
genji.np = {};

// setup cache, event emitter and filter.
var ge = genji.web.middleware.globalEmitter;
var cache = exports.cache = genji.np.cache = new genji.cache.Memory;
var event = exports.event = genji.np.event = new genji.core.Event;
var filter = exports.filter = genji.np.filter = new genji.pattern.Filter;

// error handling
ge.addListener('error', function(err) {
    var code = err.code || 500;
    exports.view.render('/views/error/' + code + '.html', {url: err.request.url}, function(html) {
        var res =  err.response;
        res.writeHead(code, {'Content-Type': 'text/html', 'Content-Length': Buffer.byteLength(html, 'utf8')});
        res.write(html);
        res.end();
    });
});

var defaultContext = {};

// loading settings
process.nextTick(function() {
    var setting = exports.db.setting,
    post = exports.db.post;
    setting.findOne({
        '_id': 'defaultTracker'
    }).then(function(trackerObj) {
        tracker = trackerObj || {
            code: ''
        };
        cache.set('defaultTracker', tracker.code);
    });
    setting.findOne({
        '_id': 'site'
    }).then(function(site) {
        site = site || {};
        cache.set('title', site.title || 'nodepress.com');
        cache.set('intro', site.intro || 'a blogging tool built on top of nodejs');
    });

    exports.defaultContext = {
        staticUrl: settings.staticUrl,
        debugUrl: settings.env.type === 'development' ? '/debug' : '',
        cookieName: settings.cookieName,
        get tracker() {
            return cache.get('defaultTracker');
        },
        get title() {
            return cache.get('title');
        },
        get intro() {
            return cache.get('intro');
        }
    };
});

// bind events

event.addListener('management.api.saveSetting', function(data) {
    if (data._id == 'site') {
        if (data.title) cache.set('title', data.title);
        if (data.intro) cache.set('intro', data.intro);
    }
});
