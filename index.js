var Path = require('path');

var apis = [], urls = [], jsonrpcProviders = [];

function setupCore(settings) {
  // load dependences
  var np = {}, genji = np.genji = require('genji'),
    EventEmitter = require('events').EventEmitter;

  // setup cache, event emitter, promise and filter.
  var Cache = require('./core/cache');
  np.cache = new Cache;
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
      staticUrl: settings.client.staticUrl
    });
  }

  // setup handler
  if (settings.handler) {
    np.handler = require('./handler');
  }

  // env
  process.env['NODE_ENV'] = settings.env;

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
    if (settings.middlewares) {
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
}

function setupCluster(settings, server) {
  var _cluster = require('cluster'),
    cluster = _cluster(server);
  for (var env in settings) {
    env !== 'common' && cluster['in'](env);
    var options = settings[env].options,
      plugins = settings[env].plugins;
    // set options
    for (var k in options) {
      cluster.set(k, options[k]);
    }
    // plugins
    Array.isArray(plugins) && plugins.forEach(function(plugin) {
      var name = plugin.shift();
      cluster.use(_cluster[name].apply(_cluster, plugin));
    })
  }
  return cluster;
}

function createServer(settings, np) {
  if (!np) {
    // construct the nodepress core if not setted
    var np = setupCore(settings);
    global.np = np;
    np.settings = settings;
    setupApps(settings, np);
  }
  var server = np.genji.web.createServer(settings.middlewares);
  return settings.cluster ? setupCluster(settings.cluster, server) : server;
}

function startServer(settings) {
  // start server
  var server = createServer(settings);

  function listen() {
    server.listen(settings.port, settings.host, function() {
      if (settings.env === 'development') {
        console.log('Server started at: http://%s:%s', settings.host, settings.port);
      }
    });
  }

  if (require('net').isIP(settings.host) === 0) {
    require('dns').lookup(settings.host, function(err, ip, addressType) {
      if (err) throw err;
      settings.host = ip;
      listen();
    });
  } else {
    listen();
  }
}

exports.createServer = createServer;
exports.startServer = startServer;
exports.setupCore = setupCore;
exports.setupApps = setupApps;