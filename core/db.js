
var Base = require('../lib/genji/lib/genji/core/base').Base,
Promise = require('./promise').Promise,
mongo = require('../lib/node-mongodb-native/lib/mongodb'),
Pool = require('./pool').Pool;

var settings = {
    db: {
        host:'127.0.0.1',
        port:27017,
        name: 'nodepress'
    }
};
var sys = require('sys');

function getConn(num, callback) {
    for (var i = 0; i < num; i++) {
        var dbServer = new mongo.Server(settings.db.host, settings.db.port, {});
        var db = new mongo.Db(settings.db.name, dbServer, {});
        db.open(function(err, db) {
            if (err) throw err;
            callback(db);
        });
    }
}

var Db = Base(function() {
    this.pool = new Pool(getConn, 1);
}, {

    giveDb: function(callback) {
        this.pool.give(callback);
    },

    giveCollection: function(name, callback) {
        this.giveDb(function(db) {
            db.collection(name, function(err, coll) {
                if (err) throw err;
                callback(db, coll);
            });
        });
    },

    find: function(collectionName, query, options, callback) {
        this.giveCollection(collectionName, function(db, coll) {
            coll.find(query, options, function(err, p) {
                if (err) throw err;
                p.toArray(function(err, posts) {
                    if (err) throw err;
                    sys.puts(posts[0].title)
                    me.pool.emit('back', db);
                });
            });
        });
    },

    allPosts: function() {
        var pool = this.pool;
        var promise = new Promise;
        this.giveCollection('posts', function(db, cp) {
            cp.find({}, function(err, p) {
                if (err) return promise.reject(err);
                p.toArray(function(err, posts) {
                    if (err) return promise.reject(err);
                    promise.resolve(posts);
                    pool.emit('back', db);
                });
            });
        });
        return promise;
    }
});

var http = require('http');
var db = new Db();
http.createServer(function(req, res) {
    db.allPosts().then(function(posts) {
        //sys.puts(posts[0].title);
        res.writeHead(200);
        res.end(posts[0].title);
    }, function() {
        sys.puts(1)
        });
}).listen(8000, '127.0.0.1');

var Collection = Base(function(name) {
    this.name = name;
    this._pool = [];
}, {
    getDb: function() {
        var dbServer = new mongo.Server(settings.db.host, settings.db.port, {});
        var db = new mongo.Db(settings.db.name, dbServer, {});
        var promise = new Promise();
        db.open(function(err, db) {
            if (err) throw err;
            promise.resolve(db);
        });
        return promise;
    },
    open: function(callback) {
        var promise = this.getDb();
        var me = this;
        promise.then(function(db) {
            db.collection(me.name, function(err, coll) {
                if (err) throw err;
                callback(db, coll);
            });
        });
    },
    save: function(data, callback) {
        this.open(function(db, coll) {
            coll.save();
        });
    },

    get: function() {
        var me = this;
        this.open(function(db, coll) {
            coll.find({}, function(err, res) {
                res.toArray(function(err, r) {
                    sys.puts(sys.inspect(r));
                    res.db.close();
                //me._pool.push(res.db);
                });
                
            });
        });
    }
});
