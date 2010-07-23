var FileHandler = genji.web.handler.FileHandler,
core = require('../core'),
client = core.client,
view = core.view,
path = require('path'),
root = path.join(genji.settings.env.root, '/static');

function handleFile(handler, path) {
    handler.setRoot(root);
    handler.staticFile(path);
}

function mainJs(handler) {
    var user = core.auth.checkCookie(handler, settings.cookieSecret)[0];
    view.render('/views/js/main.js.mu', {code: client.getCode('main.js', user)}, null, function(js) {
        handler.send(js , 200, {'Content-Type': 'application/javascript'});
    });
}

exports.view = [
    ['^/static/js/main.js$', mainJs, 'get'],
    [FileHandler, '^/static/(.*)$', handleFile, 'get']
];