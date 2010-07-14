var path = require('path'),
nun = require("../lib/nun"),
//Cache = require('./cache').Cache,
settings = genji.settings,
defaultOptions = {},
md5 = genji.crypto.md5;

//var cache = new Cache;

function setOption(key, value) {
    defaultOptions[key] = value;
}

setOption('compress', true);
setOption('cache', true);

function render(tpl, ctx, options, callback) {
    if (typeof options === 'function') callback = options;
//    var cacheKey = md5(ctx) + '_' + tpl;
//    if (cache.has(cacheKey)) {
//        callback(cache.get(cacheKey));
//        return;
//    }
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
//            cache.set(cacheKey, buffer);
            callback(buffer);
        });
    });
}

module.exports = {
    render: render,
    cache: cache,
    setOption: setOption
}