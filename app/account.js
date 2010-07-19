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

function clientCode() {
    return function($) {
        var np = $.np,
        emitter = np.emitter;
        $.np.signIn = function() {
            $.ajax({
                url: '/signin/',
                type: 'POST',
                dataType: 'text',
                data: {
                    username: np.username.attr('value'),
                    password: np.password.attr('value')
                },
                success: function(data) {
                    emitter.trigger('@Login', [data]);
                },
                error: function(xhr, status) {
                    emitter.trigger('#Login', [xhr, status]);
                }
            });
        }

        // events
        emitter.bind('@Login', function(event, data) {
            location.href = '/';
        });
        emitter.bind('#Login', function(event, xhr, status) {
            $.gritter.add({
                title: "Failed to sign in",
                time: 3000,
                text: xhr.responseText
            });
        });
    }
}

module.exports = {
    client: {
        filename: 'main.js',
        name: 'account',
        position: 'after#blog',
        code: clientCode()
    },
    db: {
        user: user
    },
    view: _view
}