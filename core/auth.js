var genji = require('genji'),
  crypto = genji.require('crypto'),
  auth = genji.require('auth');

function checkCookie(cookie) {
  if (cookie) {
    return auth.verify(crypto.base64Decode(cookie), module.exports.cookieSecret);
  }
  return false;
}

function signin(user, credential, expire, data) {
  if (auth.checkPassword(credential, user["password"])) {
    var signed = auth.sign(user['username'], expire, data, module.exports.cookieSecret);
    return signed ? crypto.base64Encode(signed) : false;
  }
  return false;
}


module.exports = {
  checkCookie: checkCookie,
  makePassword: auth.makePassword,
  checkPassword: auth.checkPassword,
  signin: signin
};