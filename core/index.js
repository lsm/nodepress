// exports modules
var Buffer = require('buffer').Buffer;
exports.auth = require('./auth'),
exports.db = require('./db'),
exports.client = require('./client'),
exports.promise = require('./promise'),
settings = genji.settings,
EventEmitter = require('events').EventEmitter,
exports.view = require('./view');

// nodepress global object
genji.np = exports;

// setup cache, event emitter and filter.
var cache = exports.cache = new genji.pattern.Cache;
var event = exports.event = new EventEmitter;
var factory = exports.factory = new genji.pattern.Factory;

// shortcuts
exports.on = function(type, callback) {
    event.on(type, callback);
}

exports.emit = function() {
    event.emit.apply(event, arguments);
}

var defaultContext = {};

// load settings
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
        cache.set('title', site.title || 'Nodepress');
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

// utilities
exports.util = {
    now: function() {
        return new String((new Date()).getTime());
    }
}