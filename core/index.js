// exports modules
var Buffer = require('buffer').Buffer;
exports.auth = require('./auth'),
    exports.db = require('./db'),
    exports.promise = require('./promise'),
    exports.view = require('./view');

// nodepress global object
genji.np = {};

// setup cache, event emitter and filter.
var ge = genji.web.middleware.globalEmitter;
var cache = exports.cache = genji.np.cache = new genji.cache.Memory;
var event = exports.event = genji.np.event = new genji.core.Event;
var filter = exports.filter = genji.np.filter = new genji.pattern.Filter;

// error handling
ge.addListener('error', function(exception, code, url, res) {
    exports.view.render('/views/error/' + code + '.html', {url: url}, function(html) {
       res.writeHead(code, {'Content-Type': 'text/html', 'Content-Length': Buffer.byteLength(html, 'utf8')});
       res.write(html);
       res.end();
    });
});

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
        '_id': 'title'
    }).then(function(title) {
        cache.set('title', title || 'nodepress.com');
    });
    setting.findOne({
        '_id': 'intro'
    }).then(function(intro) {
        cache.set('intro', intro || 'a blogging tool built on top of nodejs');
    });
});

// bind events