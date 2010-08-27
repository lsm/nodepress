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

function nodepressJs(handler, type, group) {
    var compress = genji.settings.env.type == "development";
    try {
        client.getCombined(type, group, compress, function(code) {
            if (code) {
                handler.send(code, 200, {
                    'Content-Type': type == "js" ? 'application/javascript' : "text/css"
                });
            }
        });
    } catch(e) {
        handler.setStatus(404);
        handler.sendHTML("File not found");
    }
}

exports.view = [
    ['^/static/js/main.js$', mainJs, 'get'],
    ['^/static/js/user.js$', userJs, 'get'],
    ['^/static/(js|css)/' + client.combinedScriptPrefix + '(\\w+).(js|css)$', nodepressJs, 'get'],
    [FileHandler, '^/static/(.*)$', handleFile, 'get']
];