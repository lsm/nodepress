var context = {},
jsp = require("parse-js"),
pro = require("process"),
url = require("url"),
fs = require("fs"),
cache,
Path = require("path");

process.nextTick(function() {
    cache = genji.np.cache;
})

var scripts = {};
scripts.js = [];
scripts.css = [];
var scriptTpl = {
    js: '<script src="{{src}}" type="text/javascript" language="javascript"></script>',
    css: '<link rel="stylesheet" type="text/css" href="{{src}}" />'
}

var combinedScriptPrefix = "nodepress-";
var scriptPaths = [];

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

// try to get content from file `root` + `path`
function _getCodeFromFS(idx, script, callback) {
    fs.readFile(Path.join(genji.settings.appRoot, script.dir, script.basename), "utf8", function(err, content) {
        if (err) throw err;
        // use `idx` as we need to reserve the script order in async operation (big file load slower)
        callback(idx, content);
    });
}

function _compress(code) {
    var ast = jsp.parse(code);
    ast = pro.ast_mangle(ast);
    ast = pro.ast_squeeze(ast);
    // add `\n` and `;` to make closure working
    return "\n;" + pro.gen_code(ast) + ";";
}

function getCode(filename, compress) {
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
        if (compress) result = _compress(result);
    }
    return result;
}

// all parameters except `combinable`
function addScript(type, basename, relativeDir, relativeUrl, group) {
    if (!scripts.hasOwnProperty(type)) throw new Error("`addScript` only support type of `js` or `css`");
    scripts[type][relativeDir+basename] = {
        basename: basename,
        dir: relativeDir,
        url: relativeUrl,
        group: group
    };
}

function getScripts(type, groups, combine) {
    var ret = "", path;
    if (typeof groups == "string") groups = [groups];
    var staticUrl = genji.settings.staticUrl;
    if (staticUrl[staticUrl.length-1] != "/") staticUrl += "/";
    if (combine) {
        // if combine is enabled, just use group name as the filename of combined scripts,
        // see how we handle combined files in `app/static.js`
        for (var idx in groups) {
            path = staticUrl + type + "/" + combinedScriptPrefix + groups[idx] + "." + type;
            ret += scriptTpl[type].replace("{{src}}", path);
        }
    } else {
        for (var name in scripts[type]) {
            var script = scripts[type][name];
            if (groups.indexOf(script.group) > -1) {
                path = Path.join(script.url, script.basename);
                path = path[0] == "/" ? path.slice(1) : path;
                ret += scriptTpl[type].replace("{{src}}", staticUrl + path) + "\n";
            }
        }
    }
    return ret;
}

function getCombined(type, group, compress, callback) {
    if (compress) {
        // try to get from cache
        var cached = cache.get([type, group].join('-'));
        if (cached) {
            cb(cached, true);
        }
    }
    function cb(data, fromCache) {
        callback(data);
        if (compress && !fromCache) {
            cache.set([type, group].join('-'), data);
        }
    }
    
    var toReturn = [],
    // count how many scripts have been combined, to fix the array length problem:
    // var a = []; a[3] = 0; then a.length is 4 not 1
    found = 0,
    toCombine = [];
   for (var name in scripts[type]) {
       var script = scripts[type][name];
       if (script.group == group) {
           // construct an array with all the scripts we need to retrieve
          toCombine.push(script);
       }
   }
   if (toCombine.length == 0) {
       throw new Error("Script group " + group + " not found");
   }
   toCombine.forEach(function(script, idx) {
       // try to find from the generated code first
       var tmpCode = getCode(script.basename, compress);
       if (tmpCode) {
           // found and combine with other scripts
           toReturn[idx] = tmpCode;
           found++;
       } else {
           // otherwise, let's try to find from the filesystem
           _getCodeFromFS(idx, script, function(i, content) {
               toReturn[i] = compress && type == "js" ? _compress(content) : content;
               found++;
               if (toCombine.length == found) cb(toReturn.join(";\n"));
           });
       } 
   });
   // for the case when all code are generated
   if (toCombine.length == found) cb(toReturn.join(";\n"));
}

module.exports = {
    getCode: getCode,
    inject: inject,
    getScripts: getScripts,
    getCombined: getCombined,
    combinedScriptPrefix: combinedScriptPrefix,
    addScript: addScript
}