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
    view.render('/views/js/main.js.mu', {code: client.getCode('main.js')}, null, function(js) {
        handler.send(js , 200, {'Content-Type': 'application/javascript'});
    });
}

function userJs(handler) {
    view.render('/views/js/user.js.mu', {code: client.getCode('user.js')}, null, function(js) {
        handler.send(js , 200, {'Content-Type': 'application/javascript'});
    });
}

exports.view = [
    ['^/static/js/main.js$', mainJs, 'get'],
    ['^/static/js/user.js$', userJs, 'get'],
    [FileHandler, '^/static/(.*)$', handleFile, 'get']
];