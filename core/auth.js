var settings = genji.settings,
base64 = genji.util.base64,
auth = genji.web.auth;

function checkCookie(handler, serverKey) {
    var cookie = handler.getCookie(settings.cookieName);
    if (cookie) {
        return auth.verify(base64.decode(cookie), serverKey);
    }
    return false;
}

function checkLogin() {
    if ((this.user = checkCookie(this, settings.cookieSecret)[0])) {
        return true;
    }
    this.error(401, 'Login failed');
    return false;
}

function signin(handler, user, credential, serverKey, data) {
    if (auth.checkPassword(credential, user["password"])) {
        var expire =new Date(+ new Date + 7*24*3600*1000);
        var c = auth.sign(user['username'], expire, data, serverKey);
        handler.setCookie(settings.cookieName, base64.encode(c), {
            expires: expire,
            path: "/"
        });
        return true;
    } else {
        return false;
    }
}


module.exports = {
    checkCookie: checkCookie,
    checkLogin: checkLogin,
    signin: signin
}