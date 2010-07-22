var settings = require('./conf'),
sys = require('sys'),
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
                        sys.debug(sys.inspect(doc));
                        db.close();
                    });
                } else {
                    sys.puts("user 'admin' already exists");
                    db.close();
                }
            });
        });
    });
});