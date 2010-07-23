var context = {};

function inject(appClient) {
    for (var filename in appClient) {
        if (appClient.hasOwnProperty(filename)) {
            var app = appClient[filename];
            context[filename] = context[filename] || {};
            for (var pieceName in app) {
                if (app.hasOwnProperty(pieceName)) {
                    context[filename][pieceName] = app[pieceName];
                }
            }
        }
    }
}

function getCode(filename, validUser) {
    var ctx = context[filename], result = '';
    if (ctx) {
        var tmp = [];
        for (var name in ctx) {
            if (ctx.hasOwnProperty(name)) {
                tmp.push(name);
            }
        }
        tmp.sort(function(a, b) {
            return ctx[a].weight - ctx[b].weight;
        });
        for (var i = 0; i < tmp.length; i++) {
            if (ctx[tmp[i]].validUser === true && !validUser) {
                continue;
            }
            result +=  '\n;(' + ctx[tmp[i]].code.toString() + ')($);';
        }
    }
    return result;
}

module.exports = {
    getCode: getCode,
    inject: inject
}