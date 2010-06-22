var baseDir = require('path').dirname(__filename);
var settings = {
    lib_paths: [baseDir+"/lib/genji/lib"],
    staticUrl: 'http://nodepress.com:8080/static',
    db: {host: '127.0.0.1', port: 27017, name: 'nodepress'},
    secureKey: 'c00kie-key-4-hmac',
    cookieName: '_npc'
    ,level: 2
    ,env: 'development'
    ,servers: [
        {host: '127.0.0.1', port: 8000}
    ]
    ,middlewares: [
        {name:'response-time'},
        {name: 'error-handler'},
        {name:'logger'},
        {name:'conditional-get'},
        {name: 'router', conf: {handler: 'genji.web.handler.SimpleHandler', urls: './app'}}
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

settings.lib_paths.forEach(function(path) {
    require.paths.unshift(path);
});

module.exports = settings;