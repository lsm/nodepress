var core = require('../core'),
db = core.db,
auth = core.auth,
factory = core.factory,
Collection = db.Collection,
settings = genji.settings,
querystring = require("querystring");

factory.register('user', function(name) { return new Collection(name)}, ['users'], true);
var user = factory.user;

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

function mainJs($) {
    var np = $.np;
    np.signIn = function() {
        $.ajax({
            url: '/signin/',
            type: 'POST',
            dataType: 'text',
            data: {
                username: np.dom.username.attr('value'),
                password: np.dom.password.attr('value')
            },
            success: function(data) {
                np.emit('@Login', [data]);
            },
            error: function(xhr, status) {
                np.emit('#AjaxError', ["Login failed", xhr, status]);
            }
        });
    }

    // events
    np.on('@Login', function(event, data) {
        location.href = '/';
    });
}

function initJs($) {
    var dom = $.np.dom;
    dom.username = $('#np-username'),
    dom.password = $('#np-password'),
    dom.signin = $('#np-signin'),
    dom.signout = $('#np-signout');
    dom.signin.click($.np.signIn);
    dom.signout.click(function() {
        document.cookie = $.np.cookieName + "=" + ";path=/" + ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
        location.href = '/';
    });
}

module.exports = {
    client: {
        'main.js': {
            'app.account': {
                weight: 100,
                code: mainJs
            }
        },
        'init.js': {
            'app.account': {
                weight: 100,
                code: initJs
            }
        }
    },
    db: {
        user: user
    },
    view: _view
}