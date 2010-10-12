var core = np,
db = core.db,
auth = core.auth,
factory = core.factory,
Collection = db.Collection,
settings = core.settings,
cookieName = auth.cookieName,
cookieSecret = auth.cookieSecret,
querystring = require("querystring");

factory.register('user', function(name) {return new Collection(name)}, ['users'], true);
var user = factory.user;


function checkLogin(failure) {
    var validCookie = auth.checkCookie(this.getCookie(cookieName), cookieSecret);
    if (validCookie) {
        // valid user
        this.username = validCookie[0];
        this.userExpire = validCookie[1];
        this.userData = validCookie[2];
        return true;
    }
    // not a logged in user
    switch(typeof failure) {
        case 'function':
            failure();
            break;
        case 'string':
        case 'undefined':
            this.error(401, failure || 'Login failed');
            break;
    }
    return false;
}

function signin() {
    if (checkLogin.call(this, false)) {
        // already logged in
        this.send("ok");
        return;
    }
    var self = this;
    this.on('end', function(data) {
        var p = querystring.parse(data);
        if (p.hasOwnProperty("username") && p.hasOwnProperty("password")) {
            user.findOne({
                username: p['username']
            }).then(function(res) {
                var expire = new Date(+new Date + 7*24*3600*1000);
                if (res) {
                    var signed = auth.signin(p, res["password"], expire);
                    if (signed) {
                        self.setCookie(cookieName, signed, {
                            expires: expire,
                            path: "/"
                        });
                        self.send("ok");
                        return;
                    }
                }
                self.error(401, 'Wrong username/password pair.');
            });
        } else {
            self.error(403, 'Please enter username and password.');
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
    checkLogin: checkLogin,
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