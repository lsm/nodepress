var core = require('../core'),
db = core.db,
auth = core.auth,
Collection = db.Collection,
settings = genji.settings,
querystring = require("querystring");

var user = new Collection('users');

function signin(handler) {
    if (auth.checkCookie(handler, settings.cookieSecret)) {
        // already logged in
        handler.send("ok");
        return;
    }
    handler.on('end', function(data) {
        var p = querystring.parse(data);
        if (p.hasOwnProperty("username") && p.hasOwnProperty("password")) {
            user.findOne({
                username: p['username']
            }).then(function(res) {
                if (res && auth.signin(handler, p, res["password"], settings.cookieSecret)) {
                    handler.send("ok");
                } else {
                    handler.error(401, 'Wrong username/password pair.');
                }
            });
        } else {
            handler.error(403, 'Please enter username and password.');
        }
    });
}

var _view = [['^/signin/$', signin, 'post']];

module.exports = {
    db: {
        user: user
    },
    view: _view
}