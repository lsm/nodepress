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
  var path = type + '/';
  var scriptObj = script.getScript(path + basename);
  if (scriptObj.code) {
    var code = script.getJsCode(scriptObj.url, compress);
    handler.sendAsFile(code, {'type': 'application/javascript', etag: etag || scriptObj.hash, length: Buffer.byteLength(code)});
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
  view.render(tplName, {code: script.getJsCode('js/' + groupName, compress)}, null, function(js) {
    handler.sendAsFile(js, {'type': 'application/javascript', etag: etag});
  });
}

app.mount([
  ['^/static/js/(main|user).js\\?([0-9a-zA-Z]{32})$', buildjs, 'get'],
  ['^/static/(js|css)/(.*)\\?([0-9a-zA-Z]{32})$', handleScript, 'get'],
  ['^/static/(.*)$', handleFile, 'get']
]);