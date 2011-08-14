var genji = require('genji'),
    base64 = genji.base64,
    auth = genji.require('auth');

function checkCookie(cookie) {
    if (cookie) {
        return auth.verify(base64.decode(cookie), module.exports.cookieSecret);
    }
    return false;
}

function signin(user, credential, expire, data) {
    if (auth.checkPassword(credential, user["password"])) {
        var signed = auth.sign(user['username'], expire, data, module.exports.cookieSecret);
        return signed ? base64.encode(signed) : false;
    }
    return false;
}


module.exports = {
    checkCookie: checkCookie,
    makePassword: auth.makePassword,
    checkPassword: auth.checkPassword,
    signin: signin
};