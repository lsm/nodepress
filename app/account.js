var db = np.db;
var auth = np.auth;
var cookieName = auth.cookieName;

var app = np.genji.app();
var user = db.collection('users');

/**
 * Check if current session is logged in.
 *
 * @param {Object} handler Handler object passed to your request handling function
 * @param {Function|String} failHandler When session is not valid, you can set `failHandler` to :
 *  - {Function} your customized function to handle the failure.
 *  - {String} error message or html which will display to user.
 *  - {null} do nothing just return false.
 *  - send default message with status code 401 if this argument is ignored.
 */
function checkLogin(handler, failHandler) {
  var validCookie = auth.checkCookie(handler);
  if (validCookie) {
    // valid user
    handler.username = validCookie[0];
    handler.userExpire = validCookie[1];
    handler.userData = validCookie[2];
    return true;
  }
  // not a logged in user
  if (failHandler === null) return false;
  switch (typeof failHandler) {
    case 'function':
      failHandler();
      break;
    case 'string':
    case 'undefined':
      handler.error(401, failHandler || 'Login failed');
      break;
  }
  return false;
}

function signin(handler) {
  if (checkLogin(handler, null)) {
    // already logged in
    handler.send("ok");
    return;
  }
  handler.on('params', function(params) {
    if (params.hasOwnProperty("username") && params.hasOwnProperty("password")) {
      user.findOne({
        username: params.username
      }).then(function(res) {
          var expire = new Date(+new Date + 7 * 24 * 3600 * 1000);
          if (res) {
            var signed = auth.signin(params, res.password, expire);
            if (signed) {
              handler.setCookie(cookieName, signed, {
                expires: expire,
                path: "/"
              });
              handler.send("ok");
              return;
            }
          }
          handler.error(401, 'Wrong username/password pair.');
        });
    } else {
      handler.error(403, 'Please enter username and password.');
    }
  });
}

app.mount([
  ['^/signin/$', signin, 'post']
]);

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
  $('#np-login-form').keypress(function(event) {
    if (event.which == '13') {
      event.preventDefault();
      $.np.signIn();
    }
  });
  dom.signout.click(function() {
    document.cookie = $.np.cookieName + "=" + ";path=/" + ";expires=Thu, 01-Jan-1970 00:00:01 GMT";
    location.href = '/';
  });
}

np.script.addJsCode('js/main.js', mainJs, 'main');
np.script.addJsCode('js/init.js', initJs, 'inline');

module.exports = {
  checkLogin: checkLogin
};