var script = np.script,
  view = np.view,
  settings = np.settings,
  Path = require('path'),
  minify = settings.env === "production";

var app = np.genji.app();


function getAbsPath(path) {
  return Path.join(script.staticRoot, decodeURIComponent(path));
}

function handleScript(handler, type, basename, etag) {
  var path = type + '/' + basename;
  var scriptObj = script.getScript(path, minify);
  if (scriptObj.code) {
    var meta = {type: scriptObj.contentType, etag: etag || scriptObj.hash, length: scriptObj.length};
    handler.sendAsFile(scriptObj.code, meta);
  } else {
    handleFile(handler, path);
  }
}

function handleFile(handler, path) {
  handler.staticFile(getAbsPath(path));
}

function buildjs(handler, groupName, etag) {
  groupName = groupName + '.js';
  var tplName = 'js/' + groupName + '.mu';
  var scriptObj = script.getScript('js/' + groupName, minify);
  view.render(tplName, {code: scriptObj.code}, null, function(js) {
    handler.sendAsFile(js, {'type': 'application/javascript', etag: etag || script.hash});
  });
}

app.mount([
  ['^/static/js/(main|user).js\\?([0-9a-zA-Z]{32})$', buildjs, 'get'],
  ['^/static/(js|css)/(.*)\\?([0-9a-zA-Z]{32})$', handleScript, 'get'],
  ['^/static/(.*)$', handleFile, 'get']
]);