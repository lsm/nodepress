var db = np.db,
  auth = np.auth,
  cookieName = auth.cookieName,
  cookieSecret = auth.cookieSecret;

var app = np.genji.app();
var user = db.collection('users');

// create an admin account if not exits
process.nextTick(function() {
  user.findOne({username: 'admin'}).then(function(doc) {
    if (!doc) {
      user.save({username: 'admin', password: auth.makePassword('1')}).then(function(result) {
        if (result._id) {
          console.log('Your account created, \nusername: admin, \npassword: 1');
        }
      });
    }
  });
});


function checkLogin(handler, failure) {
  var validCookie = auth.checkCookie(handler.getCookie(cookieName), cookieSecret);
  if (validCookie) {
    // valid user
    handler.username = validCookie[0];
    handler.userExpire = validCookie[1];
    handler.userData = validCookie[2];
    return true;
  }
  // not a logged in user
  switch (typeof failure) {
    case 'function':
      failure();
      break;
    case 'string':
    case 'undefined':
      handler.error(401, failure || 'Login failed');
      break;
  }
  return false;
}

function signin(handler) {
  if (checkLogin(handler, false)) {
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
np.script.addJsCode('js/init.js', initJs, 'main');

module.exports = {
  checkLogin: checkLogin
};