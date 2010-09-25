var path = require('path'),
nun = require("nun"),
settings = genji.settings,
defaultOptions = {},
md = require('markdown').Markdown;


function setOption(key, value) {
    defaultOptions[key] = value;
}

setOption('compress', false);
setOption('cache', true);
setOption('viewPath', path.join(settings.env.root, '/views'));


function render(tpl, ctx, options, callback) {
    if (typeof options === 'function') callback = options;
    options = options || defaultOptions;
    nun.render(path.join(defaultOptions.viewPath, tpl), ctx, options, function (err, output) {
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
    render: render,
    markdown: md,
    setOption: setOption
}