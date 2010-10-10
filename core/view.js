var path = require('path'),
nun = require("nun"),
defaultOptions,
md = require('markdown').Markdown;


function init(viewRoot, compress, cache) {
    defaultOptions = {
        viewRoot: viewRoot,
        compress: compress || false,
        cache: cache || false
    };
}

function render(tpl, ctx, options, callback) {
    if (typeof options === 'function') callback = options;
    options = options || defaultOptions;
    nun.render(path.join(defaultOptions.viewRoot, tpl), ctx, options, function (err, output) {
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

module.exports = {
    init: init,
    render: render,
    markdown: md
}