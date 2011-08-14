
var genji = require('genji').short();
var connect = require('mongodb-async').connect;
var EventEmitter = require('events').EventEmitter;

function setupCore(settings) {
  // load dependences
  var np = new EventEmitter;
  np.genji = genji;

  // setup cache, event emitter.
  var Cache = require('./core/cache');
  np.cache = new Cache;

  // setup view
  if (settings.view) {
    np.view = require('./core/view');
    np.view.init(settings.view.viewRoot, settings.view.compress, settings.view.cache);
  }

  // setup db
  if (settings.db) {
    var dbSettings = settings.db
    var dbServer = connect(dbSettings.host, dbSettings.port, {poolSize: dbSettings.poolSize || 2});
    np.db = dbServer.db(dbSettings.name);
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

  // setup form handler
  np.FormHandler = require('./core/form');

  // env
  process.env['NODE_ENV'] = settings.env;
  
  return np;
}

function setupApps(settings, np) {
  var apps = settings.installedApps;
  if (Array.isArray(apps) && apps.length > 0) {
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
        throw new Error('format of `installedApps` setting not correct.');
      }

      if (module.hasOwnProperty('db')) {
        for (var name in module['db']) {
          np.db[name] = module['db'][name];
        }
      }

      if (module.hasOwnProperty('client')) {
        np.client.inject(module.client);
      }
      
      np.app[appName] = module;
    });
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