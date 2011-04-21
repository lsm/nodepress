var path = require('path'),
genji = require('genji');
var settings = {
    db: {
        servers: 'mongo://127.0.0.1:27017/nodepress',
        poolSize: 5
    },
    client: {
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
        'conditional-get': {},
        'router': {handler: genji.web.handler.SimpleCookieHandler}
    }
};

try {
    var local_settings = require('./settings');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {}


module.exports = settings;