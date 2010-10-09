var Path = require('path');

setupRequirePath();

var db, client, np = {},
apis = [],
urls = [];
np.app = {};


function setupRequirePath() {
    [
        Path.join(__dirname, "/lib"),
        Path.join(__dirname, "/lib/genji/lib"),
        Path.join(__dirname, "/lib/fugue/lib"),
        Path.join(__dirname, "/lib/node-mongodb-native/lib"),
        Path.join(__dirname, "/lib/UglifyJS/lib"),
        Path.join(__dirname, "/lib/node-markdown/lib")
    ].forEach(function(path) {
        require.paths.unshift(path);
    });
}

function setupCore() {
    // load core modules
    np.auth = require('./core/auth'),
    np.db = require('./core/db'),
    np.client = require('./core/client'),
    np.promise = require('./core/promise'),
    settings = np.settings,
    genji = np.genji,
    EventEmitter = require('events').EventEmitter,
    np.view = require('./core/view');


    // setup cache, event emitter and filter.
    np.cache = new genji.pattern.Cache;
    var event = np.event = new EventEmitter;
    np.factory = new genji.pattern.Factory;

    // the global `np` object can act as an event emitter
    np.on = function(type, callback) {
        event.on(type, callback);
    }

    np.emit = function() {
        event.emit.apply(event, arguments);
    }

    // utilities
    np.util = {
        now: function() {
            return new String((new Date()).getTime());
        }
    }
}

function setupApps(apps) {
    apps.forEach(function(app) {
        var module, name;
        if (typeof app == 'string') {
            module = require('./app/' + app);
            name = app;
        } else if (typeof app == 'object') {
            module = require(app.require);
            name = app.name;
        } else {
            throw new Error('setting format of `installedApps` not correct.');
        }
        if (module.hasOwnProperty('api')) {
            apis = apis.concat(app['api']);
        }
        if (module.hasOwnProperty('db')) {
            for (var name in app['db']) {
                db[name] = app['db'][name];
            }
        }
        if (module.hasOwnProperty('view')) {
            urls = urls.concat(app['view']);
        }
        if (module.hasOwnProperty('client')) {
            client.inject(app.client);
        }
        np.app[name] = module;
    });
}

function startServer(settings) {
    // settings and genji
    np.settings = settings;
    np.genji = require('genji');
    global.np = np;
    setupCore();
    // setup application if any
    if (Array.isArray(settings.installedApps) && settings.installedApps.length > 0) {
        setupApps(settings.installedApps);
        urls.push([settings.apiPrefix || '^/_api/', apis]);
        settings.middlewares.forEach(function(m) {
            if (m.name == 'router') {
                if (Array.isArray(m.urls)) {
                    m.urls = m.urls.concat(urls);
                } else {
                    m.urls = urls;
                }
            }
        });
    }
    // start server
    return genji.web.startServer(settings);
}

exports.startServer = startServer;