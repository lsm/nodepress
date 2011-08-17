var path = require('path');
var genji = require('genji').short();
var nodepress = require('nodepress');


var settings = {
  db: {
    host: '127.0.0.1',
    port: '27017',
    name: 'nodepress',
    poolSize: 5
  },
  script: {
    staticUrl: 'http://127.0.0.1:8000/static/'
  },
  auth: {
    cookieSecret: 'c00kie-key-4-hmac',
    cookieName: '_npc_dev'
  },
  view: {
    compress: false,
    cache: false
  }
  ,env: 'development'
  ,appRoot: __dirname
  ,host: '127.0.0.1'
  ,port: 8000
  ,installedApps: ['init', 'account', 'blog', 'management', 'static', 'tag']
  ,middlewares: {
    'response-time': {},
    'error-handler': {uncaughtException: false},
    'logger': {level: 'info'},
    'conditional-get': {}
  }
};

try {
  var local_settings = require('./settings');
  genji.extend(settings, local_settings);
} catch(e) {}


nodepress.startServer(settings);