var baseDir = require('path').dirname(__filename);
var settings = {
    lib_paths: [baseDir+"/lib/genji/lib"],
    baseDir: baseDir,
    urls: './blog',
    staticUrl: 'http://nodepress.com:8080/static',
    servers: [{port:8000, host: '0.0.0.0'}],
    db: {host: '127.0.0.1', port: 27017, name: 'nodepress'},
    handler: 'genji.web.handler.SimpleHandler',
    secureKey: 'c00kie-key-4-hmac',
    cookieName: '_npc',
    level: 2,
    debug: true
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