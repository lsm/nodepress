var path = require('path'),
  nun = require("nunz"),
  md = require('node-markdown').Markdown;


function init(viewRoot, compress, cache) {
  exports.viewRoot = viewRoot || path.join(__dirname, '../views'),
    exports.compress = compress || false,
    exports.cache = cache || false
}

function render(tpl, ctx, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  options = options || exports;
  nun.render(path.join(exports.viewRoot, tpl), ctx, options, function (err, output) {
    if (err) {
      throw err;
    }
    var buffer = '';
    output.addListener('data', function (c) {
      buffer += c;
    })
      .addListener('end', function () {
        callback(buffer);
      });
  });
}

exports.init = init;
exports.render = render;
exports.markdown = md;