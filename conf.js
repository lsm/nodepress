var path = require('path'),
baseDir = path.dirname(__filename);
var settings = {
    libPath: [path.join(baseDir, "/lib/genji/lib"), path.join(baseDir, "/lib/node-mongodb-native/lib")],
    staticUrl: 'http://127.0.0.1:8000/static',
    db: 'mongo://127.0.0.1:27017/nodepress',
    cookieSecret: 'c00kie-key-4-hmac',
    cookieName: '_npc'
    ,env: {type: 'development', root: baseDir, level: 2}
    ,servers: [
        {host: '127.0.0.1', port: 8000}
    ]
    ,installedApps: ['account', 'blog', 'management', 'static', 'tag']
    ,middlewares: [
        {name:'response-time'},
        {name: 'error-handler'},
        {name:'logger'},
        {name:'conditional-get'},
        {name: 'router', conf: {handler: 'genji.web.handler.SimpleCookieHandler', urls: './urls'}}
    ]
};

try {
    var local_settings = require('./local_conf');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {
    require('sys').puts(e);
}

settings.libPath.forEach(function(path) {
    require.paths.unshift(path);
});

module.exports = settings;
