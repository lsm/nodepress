var nun = require("./lib/nun"),
settings = genji.settings,
base64 = genji.utils.base64,
auth = genji.web.auth,
path = require('path'),
querystring = require("querystring"),
mongo = require('./lib/node-mongodb-native/lib/mongodb');

var dbServer = new mongo.Server(settings.db.host, settings.db.port, {});


// functions for user authentication
function _checkCookie(handler, serverKey) {
    var cookie = handler.getCookie(settings.cookieName);
    if (cookie) {
        return auth.verify(base64.decode(cookie), serverKey);
    }
    return false;
}

function _checkLogin(handler) {
    if ((handler.user = _checkCookie(handler, settings.secureKey)[0])) {
        return true;
    }
    handler.error(401);
    return false;
}

function _signin(handler, user, credential, serverKey, data) {
    if (auth.checkPassword(credential, user["password"])) {
        var expire =new Date(+ new Date + 7*24*3600*1000);
        var c = auth.sign(user['username'], expire, data, serverKey);
        handler.setCookie(settings.cookieName, base64.encode(c), {expires: expire, path: "/"});
        return true;
    } else {
        return false;
    }
}

function signin(handler) {
    if (_checkCookie(handler, settings.secureKey)) {
        // already logged in
        handler.send("ok", 200, {'Content-Type': 'text/plain'});
        return;
    }
    handler.on('end', function(data) {
        var p = querystring.parse(data);
        if (p.hasOwnProperty("username") && p.hasOwnProperty("password")) {
            var db = new mongo.Db(settings.db.name, dbServer, {});
            db.open(function(err, db) {
                db.collection('users', function(err, users) {
                    users.findOne({
                        "username": p['username']
                        }, function(err, res) {
                        if (res && _signin(handler, p, res["password"], settings.secureKey)) {
                            handler.send("ok", 200, {'Content-Type': 'text/plain'});
                        } else {
                            handler.error(401, 'Wrong username/password pair.');
                        }
                        db.close();
                    });
                });
            });
        } else {
            handler.error(403);
        }
    });
}

// on client side?
function signout(handler) {
    handler.clearCookie(settings.cookieName, {path: "/"});
}


function index(handler) {
    var user = _checkCookie(handler, settings.secureKey)[0];
    var is_owner;
    if (user) {
        is_owner = [{name: user}];
    }
    var ctx = {staticUrl: settings.staticUrl, is_owner: is_owner, cookieName: settings.cookieName};
    nun.render(path.join(__dirname, '/views/index.html'), ctx, {}, function (err, output) {
        if (err) {
            throw err;
        }
        var buffer = '';
        output.addListener('data', function (c) {
            buffer += c;
        })
        .addListener('end', function () {
            handler.send(buffer);
        });
    });
}

function _now() {
    return (new Date()).getTime() + ''; // save as string
}

function save(handler) {
    handler.on('end', function(data) {
        data = JSON.parse(data); // @todo SyntaxError: Unexpected token ILLEGAL
        var db = new mongo.Db(settings.db.name, dbServer, {});
        if (!data.hasOwnProperty('_id')) {
            data.created = _now();
        } else {
            data.modified = _now();
        }
        if (data.hasOwnProperty('published') && data.published == 1) {
            data.published = _now();
        }
        db.open(function(err, db) {
            db.collection('posts', function(err, posts) {
                posts.save(data, function(err, doc) {
                    handler.send(doc._id);
                    db.close();
                });
            });
        });
    });   
}

function list(handler, skip, limit, tags) {
    var db = new mongo.Db(settings.db.name, dbServer, {});
    skip = parseInt(skip) ? skip : 0;
    limit = parseInt(limit) ? limit : 5;
    if (limit > 10 || limit < 1) limit = 5; // default
    db.open(function(err, db) {
       db.collection('posts', function(err, cPosts) {
           var query = {published: {$exists: true}};
           if (tags) {
               tags = tags.split(',');
               query.tags = {$all: tags};
           }
           cPosts.find(query, {sort:[["published", -1]], limit:limit, skip: skip}, function(err, posts) {
               posts.toArray(function(err, posts) {
                   handler.send(posts);
                   db.close();
               });
           });
       });
    });
}

function hello_world(handler) {
    handler.send('Hello world!');
}

function _jsonHeader(handler) {
    handler.setHeader("Content-Type", "application/json; charset=utf-8");
    return true;
}

function debug(handler) {
    handler.staticFile(settings.baseDir+"/views/debugger.html");
}
function rightjs(handler) {
    handler.staticFile(path.join(settings.baseDir, '/static/js/rightjs/right-1.5.6.js'), null, function(err) {
        if (err) handler.error(404, 'File not found');
    });
}

var apis = [
    ['save/$', save, 'post', [_checkLogin]],
    ['list/([0-9])+/([0-9])+/(.*)/$', list, 'get'],
    ['list/([0-9])+/([0-9])+/$', list, 'get'],
    ['list/$', list, 'get'],
];

module.exports = [
    ['^/$', index],
    ['^/_api/', apis, [_jsonHeader]],
    ["^/debug$", debug],
    ["^/signin/$", signin],
    ["^/right\.js$", rightjs],
    ['^/hello/$', hello_world],
];