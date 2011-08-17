var nodepress = require('nodepress');
var genji = nodepress.genji;


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
    compress: true,
    cache: true
  }
  ,env: 'production'
  ,host: '127.0.0.1'
  ,port: 8000
  ,apps: ['init', 'account', 'blog', 'management', 'static', 'tag']
  ,middlewares: {
    'response-time': {},
    'error-handler': {uncaughtException: true},
    'logger': {level: 'info'},
    'conditional-get': {}
  }
};

try {
  var local_settings = require('./settings');
  genji.extend(settings, local_settings);
} catch(e) {}


nodepress.startServer(settings);