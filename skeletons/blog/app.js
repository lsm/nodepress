var path = require('path');
var settings = {
    staticUrl: 'http://127.0.0.1:8000/static/',
    ,db: 'mongo://127.0.0.1:27017/nodepress'
    ,cookieSecret: 'c00kie-key-4-hmac'
    ,cookieName: '_npc'
    ,env: 'production'
    ,host: '127.0.0.1'
    ,port: 8000
    ,installedApps: ['init', 'account', 'blog', 'management', 'static', 'tag']
};

try {
    var local_settings = require('./settings');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {}

settings.libPath.forEach(function(path) {
    require.paths.unshift(path);
});


module.exports = settings;