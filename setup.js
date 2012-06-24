var settings = require('./settings'),
util = require('util'),
mkpass = require('./lib/genji/lib/genji/web/auth').makePassword,
mongo = require('./lib/node-mongodb-native/lib/mongodb');

mongo.connect(settings.db, function(err, db) {
    db.open(function(err, db) {
        db.collection('users', function(err, users) {
            users.count({
                username: 'admin'
            }, function(err, num) {
                if (num == 0) {
                    users.insert({
                        username: 'admin',
                        password: mkpass('1')
                        }, function(err, doc) {
                        util.debug(util.inspect(doc));
                        db.close();
                    });
                } else {
                    util.puts("user 'admin' already exists");
                    db.close();
                }
            });
        });
    });
});