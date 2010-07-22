
var context = {};
var posIdx = {};

function inject(app) {
    context[app.filename] = context[app.filename] || [];
    //ctx[app.filename].push('(' + app.code.toString() + ')($)\n');
    app.code = ';(' + app.code.toString() + ')($)\n';
    context[app.filename].push(app);
}

function getCode(filename) {
    var ctx = context[filename];
    if (Array.isArray(ctx)) {
        var result = []
        ctx.forEach(function(app) {
            result.push(app.code);
            if (app.hasOwnProperty('position')) {
                ctx.forEach(function(refApp, idx) {
                    if (app.position.indexOf(refApp.name) > -1) {
                        var pos = app.position.split('#');
                        switch(pos[0]) {
                            case 'after':
                                result.unshift(refApp.code);
                            case 'before':
                                result.push(refApp.code);
                            case 'replace':
                                result[result.indexOf(app.code)] = refApp.code;
                        }
                        delete ctx[idx];
                    }
                });
                dump(ctx.length)
            }
        });
        return result.join('/***/');
    }
    return '';
}

module.exports = {
    getCode: getCode,
    inject: inject
}