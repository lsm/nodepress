var FileHandler = genji.web.handler.FileHandler,
path = require('path'),
root = path.join(genji.settings.root, '/static')

function handleFile(handler, path) {
    handler.setRoot(root);
    handler.staticFile(path);
}


exports.view = [[FileHandler, '^/static/(.*)$', handleFile, 'get']];