var nun = require("./lib/nun"),
settings = genji.settings,
base64 = genji.utils.base64,
md5 = genji.crypto.md5,
auth = require('./core/auth'),
mongo = require('./lib/node-mongodb-native/lib/mongodb');


// functions for user authentication




// on client side?
function signout(handler) {
    handler.clearCookie(settings.cookieName, {
        path: "/"
    });
}


// post

function getTracker(handler, callback) {
    var db = new mongo.Db(settings.db.name, dbServer, {});
    function send(tracker) {
        if (callback) {
            callback(tracker);
        } else {
            handler.send(tracker.code);
        }
    }
    if (tracker) {
        send(tracker);
        return;
    }
    db.open(function(err, db) {
        db.collection('settings', function(err, settings) {
            settings.findOne({
                _id: 'defaultTracker'
            }, function(err, trackerObj) {
                tracker = trackerObj || {
                    code: ''
                };
                send(tracker);
                db.close();
            })
        });
    });
}

function saveTracker(handler) {
    handler.on('end', function(data) {
        var db = new mongo.Db(settings.db.name, dbServer, {});
        db.open(function(err, db) {
            db.collection('settings', function(err, settings) {
                settings.save({
                    _id: 'defaultTracker',
                    code: data
                }, function() {
                    tracker = {code: data};
                    handler.send('ok');
                    db.close();
                });
            });
        });
    })
}

function hello_world(handler) {
    handler.send('Hello world');
}

function _jsonHeader(handler) {
    handler.setHeader("Content-Type", "application/json; charset=utf-8");
    return true;
}

var blog = require('./app/blog');
var account = require('./app/account');

var apis = [
['get/tracker/$', getTracker, 'get', [auth.checkLogin]],
['save/tracker/$', saveTracker, 'post', [auth.checkLogin]],
];

apis = apis.concat(blog.api);

var urls = [
    ['^/_api/', apis],
    ['^/hello/$', hello_world],
    ];

urls = urls.concat(blog.view);
urls = urls.concat(account.view);

urls.reverse();
module.exports = urls;
    