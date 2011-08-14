var path = require('path'),
genji = require('genji');
var settings = {
    db: {
        host: '127.0.0.1',
      port: '27017',
      name: 'nodepress',
        poolSize: 5
    },
    client: {
        staticUrl: 'http://127.0.0.1:8000/static/'
    },
    auth: {
        cookieSecret: 'c00kie-key-4-hmac',
        cookieName: '_npc'
    },
    view: {
        compress: true,
        cache: true
    }
    ,env: 'production'
    ,appRoot: __dirname
    ,host: '127.0.0.1'
    ,port: 8000
    ,installedApps: ['init', 'account', 'blog', 'management', 'static', 'tag']
    ,middlewares: {
        'response-time': {},
        'error-handler': {uncaughtException: true},
        'logger': {level: 'info'},
        'conditional-get': {},
        'router': {handler: genji.handler.Handler}
    }
};

try {
    var local_settings = require('./settings');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {}


module.exports = settings;