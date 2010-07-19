
var ctx = {};


function inject(app) {
    ctx[app.filename] = ctx[app.filename] || [];
    ctx[app.filename].push('(' + app.code.toString() + ')($)\n');
}

function getCode(filename) {
    return ctx[filename].join('/*** App client code delimiter ***/\n');
}

module.exports = {
    getCode: getCode,
    inject: inject
}