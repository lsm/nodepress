var Path = require('path');

setupRequirePath();

var db, client, np
apis = [],
urls = [];


function setupRequirePath() {
    [
        Path.join(__dirname, "/lib"),
        Path.join(__dirname, "/lib/genji/lib"),
        Path.join(__dirname, "/lib/nomnomargs/lib"),
        Path.join(__dirname, "/lib/fugue/lib"),
        Path.join(__dirname, "/lib/node-mongodb-native/lib"),
        Path.join(__dirname, "/lib/UglifyJS/lib"),
        Path.join(__dirname, "/lib/node-markdown/lib")
    ].forEach(function(path) {
        require.paths.unshift(path);
    });
}

function setupCore(settings) {
    // load dependences
    var np = {}, genji = np.genji = require('genji'),
    EventEmitter = require('events').EventEmitter;

    // setup cache, event emitter, promise and filter.
    np.cache = new genji.pattern.Cache;
    var event = np.event = new EventEmitter;
    np.promise = require('./core/promise');
    np.factory = new genji.pattern.Factory;

    // setup view
    if (settings.view) {
        np.view = require('./core/view');
        np.view.init(settings.view.viewRoot, settings.view.compress, settings.view.cache);
    }
    
    // setup db
    if (settings.db) {
        np.db = require('./core/db');
        np.db.init(settings.db.servers, settings.db.poolSize);
    }

    // setup auth
    if (settings.auth) {
        np.auth = require('./core/auth');
        np.auth.cookieName = settings.auth.cookieName || '_nodepressCookie';
        np.auth.cookieSecret = settings.auth.cookieSecret || '_nodepressC00kie-securekEy';
    }

    // setup client
    if (settings.client) {
        np.client = require('./core/client');
        np.client.init({
            cache: np.cache,
            staticRoot: settings.client.staticRoot,
            staticUrl: settings.client.staticUrl,
            combinedScriptPrefix: settings.client.combinedScriptPrefix
        });
    }

    // the `np` object can act as an event emitter
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
    return np;
}

function setupApps(apps) {
    np.app = {};
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
            apis = apis.concat(module['api']);
        }
        if (module.hasOwnProperty('db')) {
            for (var name in module['db']) {
                np.db[name] = module['db'][name];
            }
        }
        if (module.hasOwnProperty('view')) {
            urls = urls.concat(module['view']);
        }
        if (module.hasOwnProperty('client')) {
            np.client.inject(module.client);
        }
        np.app[name] = module;
    });
}

function startServer(settings) {
    // construct the nodepress core
    np = setupCore(settings);
    np.settings = settings;
    global.np = np;
    
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
    return np.genji.web.startServer(settings);
}

exports.startServer = startServer;
exports.getCore = setupCore;