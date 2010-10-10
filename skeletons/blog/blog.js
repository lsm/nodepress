var path = require('path'),
genji = require('genji');
var settings = {
    db: {
        servers: 'mongo://127.0.0.1:27017/nodepress',
        poolSize: 5
    },
    client: {
        staticRoot: path.join(__dirname, '/static'),
        staticUrl: 'http://127.0.0.1:8000/static/',
        combinedScriptPrefix: 'nodepress-'
    },
    auth: {
        cookieSecret: 'c00kie-key-4-hmac',
        cookieName: '_npc'
    },
    view: {
        viewRoot: path.join(__dirname, '/views'),
        compress: true,
        cache: true
    }
    ,env: 'development'
    ,appRoot: __dirname
    ,host: '127.0.0.1'
    ,port: 8000
    ,installedApps: ['init', 'account', 'blog', 'management', 'static', 'tag']
    ,middlewares: [
        {name:'response-time'},
        {name: 'error-handler'},
        {name:'logger', level: 'info'},
        {name:'conditional-get'},
        {name: 'router', handler: genji.web.handler.SimpleCookieHandler}
    ]
};

try {
    var local_settings = require('./settings');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {}


module.exports = settings;