var Path = require('path');

setupRequirePath();

var apis = [], urls = [], jsonrpcProviders = [];


function setupRequirePath() {
    [
        Path.join(__dirname, "/lib"),
        //Path.join(__dirname, "/lib/genji/lib"),
        "/Users/zai/workspace/genji/lib/",
        Path.join(__dirname, "/lib/nomnomargs/lib"),
        Path.join(__dirname, "/lib/fugue/lib"),
        Path.join(__dirname, "/lib/node-mongodb-native/lib"),
        Path.join(__dirname, "/lib/UglifyJS/lib"),
        Path.join(__dirname, "/lib/formidable/lib"),
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

    // setup handler
    if (settings.handler) {
        np.handler = require('./handler');
    }

    // the `np` object can act as an event emitter
    np.on = function(type, callback) {
        event.on(type, callback);
    }

    np.emit = function() {
        event.emit.apply(event, arguments);
    }
    
    return np;
}

function setupApps(settings, np) {
    if (Array.isArray(settings.installedApps) && settings.installedApps.length > 0) {
        var apps = settings.installedApps;
        np.app = {};
        apps.forEach(function(app) {
            var module, appName;
            if (typeof app == 'string') {
                module = require('./app/' + app);
                appName = app;
            } else if (typeof app == 'object') {
                module = require(app.require);
                appName = app.name;
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
            if (module.hasOwnProperty('jsonrpc')) {
                jsonrpcProviders = jsonrpcProviders.concat(module['jsonrpc']);
            }
            np.app[appName] = module;
        });

        urls.push([settings.apiPrefix || '^/_api/', apis]);
        if (settings.middlewares.router) {
            var router = settings.middlewares.router;
            if (Array.isArray(router.urls)) {
                router.urls = router.urls.concat(urls);
            } else {
                router.urls = urls;
            }
        }
        if (settings.middlewares.jsonrpc) {
            var jsonrpc = settings.middlewares.jsonrpc;
            if (Array.isArray(jsonrpc.providers)) {
               jsonrpc.providers = jsonrpc.providers.concat(jsonrpcProviders);
            } else {
               jsonrpc.providers = jsonrpcProviders;
            }
        }
    }
    
}

function createServer(settings, np) {
    if (!np) {
        // construct the nodepress core if not setted
        var np = setupCore(settings);
        global.np = np;
        np.settings = settings;
        setupApps(settings, np);
    }
    return np.genji.web.createServer(settings.middlewares);
}

function startServer(settings) {
    // start server
    var server = createServer(settings);
    server.listen(settings.port, settings.host, function() {
        if (settings.env == 'development') {
            console.log('Server started at: http://%s:%s', settings.host, settings.port);
        }
    });
}

exports.createServer = createServer;
exports.startServer = startServer;
exports.setupCore = setupCore;
exports.setupApps = setupApps;