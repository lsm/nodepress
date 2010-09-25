var path = require('path');
var settings = {
    libPath: [
        path.join(__dirname, "/lib"),
        path.join(__dirname, "/lib/genji/lib"),
        path.join(__dirname, "/lib/node-mongodb-native/lib"),
        path.join(__dirname, "/lib/UglifyJS/lib"),
        path.join(__dirname, "/lib/node-markdown/lib")],
    staticUrl: 'http://127.0.0.1:8000/static/',
    db: 'mongo://127.0.0.1:27017/nodepress',
    cookieSecret: 'c00kie-key-4-hmac',
    cookieName: '_npc'
    ,env: {type: 'development', root: __dirname, level: 2}
    ,host: '127.0.0.1'
    ,port: 8000
    ,installedApps: ['init', 'account', 'blog', 'management', 'static', 'tag']
    ,middlewares: [
        {name:'response-time'},
        {name: 'error-handler'},
        {name:'logger'},
        {name:'conditional-get'},
        {name: 'router', handler: 'genji.web.handler.SimpleCookieHandler', urls: './urls'}
    ]
};

try {
    var local_settings = require('./local_settings');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {
    require('sys').puts('You can define settings in ./local_settings to override defaults.');
}

settings.libPath.forEach(function(path) {
    require.paths.unshift(path);
});


module.exports = settings;