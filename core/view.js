var Base = require('../lib/genji/lib/genji/core/base').Base,
path = require('path'),
nun = require("../lib/nun"),
Cache = require('./cache').Cache,
settings = genji.settings,
md5 = genji.crypto.md5;

var Context = Base(function() {

    }, {
    
    });


var cache = new Cache;

function render(tpl, ctx, options, callback) {
//    var cacheKey = md5(ctx) + '_' + tpl;
//    if (cache.has(cacheKey)) {
//        callback(cache.get(cacheKey));
//        return;
//    }
    nun.render(path.join(settings.root, tpl), ctx, options, function (err, output) {
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
    cache: cache
}