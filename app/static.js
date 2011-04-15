var FileHandler = np.genji.web.handler.FileHandler,
core = np,
client = core.client,
view = core.view,
settings = core.settings,
Path = require('path'),
compress = settings.env != "development";


function getAbsPath(path) {
    return Path.join(client.staticRoot, decodeURIComponent(path));
}

function handleScript(handler, type, basename, etag) {
    var path = '/'+type+'/';
    if (compress && type == 'js') {
        var meta = client.getScriptMeta(type, basename, path);
        handler.sendAsFile(function(callback) {
            var code = client.getCode({type: type, url: path, basename: basename}, true);
            callback(code);
        }, {'type': 'application/javascript', etag: etag || meta.hash, length: meta.length});
    } else {
        handler.staticFile(getAbsPath(path+basename), etag);
    }
}

function handleFile(handler, path) {
    handler.staticFile(getAbsPath(path));
}

function buildjs(handler, name, etag) {
    name = name +'.js';
    var tplName = 'js/'+name+'.mu';
    view.render(tplName, {code: client.getCode({url: '/js/', basename: name}, compress)}, null, function(js) {
        handler.sendAsFile(js , {'type': 'application/javascript', etag: etag});
    });
}

function nodepressRes(handler, type, group) {
    try {
        client.getCombined(type, group, compress, function(code) {
            if (code) {
                handler.sendAsFile(code, {
                    'type': type == "js" ? 'application/javascript' : "text/css"
                });
            }
        });
    } catch(e) {
        handler.setStatus(404);
        handler.sendHTML("File not found");
    }
}

exports.view = [
    ['^/static/js/(main|user).js\\?([0-9a-zA-Z]{32})$', buildjs, 'get', FileHandler],
    ['^/static/(js|css)/' + client.combinedScriptPrefix + '(\\w+).(js|css)$', nodepressRes, 'get', FileHandler],
    ['^/static/(js|css)/(.*)\\?([0-9a-zA-Z]{32})$', handleScript, 'get', FileHandler]
    , ['^/static/(.*)$', handleFile, 'get', FileHandler]
];