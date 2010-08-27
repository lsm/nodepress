var path = require('path'),
nun = require("../lib/nun"),
settings = genji.settings,
defaultOptions = {};


function setOption(key, value) {
    defaultOptions[key] = value;
}

setOption('compress', false);
setOption('cache', true);

function render(tpl, ctx, options, callback) {
    if (typeof options === 'function') callback = options;
    options = options || defaultOptions;
    nun.render(path.join(settings.env.root, tpl), ctx, options, function (err, output) {
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
    setOption: setOption
}