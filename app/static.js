var script = np.script,
  view = np.view,
  settings = np.settings,
  Path = require('path'),
  compress = settings.env === "development";

var app = np.genji.app();


function getAbsPath(path) {
  return Path.join(script.staticRoot, decodeURIComponent(path));
}

function handleScript(handler, type, basename, etag) {
  var path = '/' + type + '/';
  if (compress && type == 'js') {
    var meta = script.getScriptMeta(path + basename);
    var code = meta.compressed || script.getCode(meta, true);
    handler.sendAsFile(code, {'type': 'application/javascript', etag: etag || meta.hash, length: meta.length});
  } else {
    handler.staticFile(getAbsPath(path + basename), etag);
  }
}

function handleFile(handler, path) {
  handler.staticFile(getAbsPath(path));
}

function buildjs(handler, groupName, etag) {
  groupName = groupName + '.js';
  var tplName = 'js/' + groupName + '.mu';
  view.render(tplName, {code: script.getCode({url: '/js/' + groupName}, compress)}, null, function(js) {
    handler.sendAsFile(js, {'type': 'application/javascript', etag: etag});
  });
}

app.mount([
  ['^/static/js/(main|user).js\\?([0-9a-zA-Z]{32})$', buildjs, 'get'],
  ['^/static/(js|css)/(.*)\\?([0-9a-zA-Z]{32})$', handleScript, 'get']
  ,
  ['^/static/(.*)$', handleFile, 'get']
]);