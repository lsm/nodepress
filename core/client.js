var context = {};
var jsp = require("parse-js");
var pro = require("process");

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

function getCode(filename) {
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
            result +=  '\n\n/*'+ tmp[i]+ '*/\n;(' + ctx[tmp[i]].code.toString() + ')($);';
        }
    }
    if (genji.settings.env.type == "development") return result;
    // compress code if not in development mode
    var ast = jsp.parse(result);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    var final_code = pro.gen_code(ast);
    // add `\n` and `;` to make closure working
    return "\n;" + final_code + ";";
}

module.exports = {
    getCode: getCode,
    inject: inject
}