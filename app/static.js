var FileHandler = genji.web.handler.FileHandler,
core = require('../core'),
client = core.client,
view = core.view,
path = require('path'),
root = path.join(genji.settings.env.root, '/static');

function handleFile(path) {
    this.setRoot(root);
    this.staticFile(path);
}

function mainJs() {
    var self = this;
    view.render('js/main.js.mu', {code: client.getCode('main.js')}, null, function(js) {
        self.send(js , 200, {'Content-Type': 'application/javascript'});
    });
}

function userJs() {
    var self = this;
    view.render('js/user.js.mu', {code: client.getCode('user.js')}, null, function(js) {
        self.send(js , 200, {'Content-Type': 'application/javascript'});
    });
}

function nodepressRes(type, group) {
    var self = this;
    var compress = genji.settings.env.type != "development";
    try {
        client.getCombined(type, group, compress, function(code) {
            if (code) {
                self.send(code, 200, {
                    'Content-Type': type == "js" ? 'application/javascript' : "text/css"
                });
            }
        });
    } catch(e) {
        self.setStatus(404);
        self.sendHTML("File not found");
    }
}

exports.view = [
    ['^/static/js/main.js$', mainJs, 'get'],
    ['^/static/js/user.js$', userJs, 'get'],
    ['^/static/(js|css)/' + client.combinedScriptPrefix + '(\\w+).(js|css)$', nodepressRes, 'get'],
    ['^/static/(.*)$', handleFile, 'get', FileHandler]
];