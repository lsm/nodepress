var Base = require('../lib/genji/lib/genji/core/base').Base,
Promise = require('./promise').Promise,
mongo = require('../lib/node-mongodb-native/lib/mongodb'),
Pool = genji.pattern.Pool;

var sys = require('sys');

function getConn(num, callback) {
    for (var i = 0; i < num; i++) {
        mongo.connect(genji.settings.db, function(err, db) {
            if (err) throw err;
            callback(db);
        });
    }
}

var connPool = new Pool(getConn, 5);

var Db = Base(function() {
     this.pool = connPool;
}, {
    giveDb: function(callback) {
        this.pool.pop(callback);
    },

    giveCollection: function(name, callback) {
        this.giveDb(function(db) {
            db.collection(name, function(err, coll) {
                if (err) throw err;
                callback(coll);
            });
        });
    },

    _find: function(collectionName, selector, fields, options, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.find(selector, fields, options, function(err, cursor) {
                if (err) throw err;
                cursor.toArray(function(err, result) {
                    if (err) throw err;
                    me.pool.emit('back', cursor.db);
                    callback(result);
                });
            });
        });
    },

    _findOne: function(collectionName, selector, options, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.findOne(selector, options, function(err, result) {
                if (err) throw err;
                me.pool.emit('back', coll.db);
                callback(result);
            });
        });
    },

    _save: function(collectionName, data, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.save(data, function(err, doc) {
                if (err) throw err;
                me.pool.emit('back', coll.db);
                callback(doc);
            });
        });
    },

    _remove: function(collectionName, selector, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.remove(selector, function(err, coll) {
                if (err) throw err;
                me.pool.emit('back', coll.db);
                callback(coll);
            });
        });
    },

    _count: function(collectionName, selector, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.count(selector, function(err, num) {
                if (err) throw err;
                me.pool.emit('back', coll.db);
                callback(num);
            });
        });
    }
});

var Collection = Db({
    init: function(name) {
        this._super();
        this.name = name;
    },
    
    find: function(selector, fields, options) {
        var promise = new Promise;
        this._find(this.name, selector, fields, options, function(result) {
            promise.resolve(result);
        });
        return promise;
    },

    findOne: function(selector, options) {
        var promise = new Promise;
        this._findOne(this.name, selector, options || {}, function(result) {
            promise.resolve(result);
        });
        return promise;
    },

    save: function(data) {
        var promise = new Promise;
        this._save(this.name, data, function(doc) {
            promise.resolve(doc);
        })
        return promise;
    },

    remove: function(selector) {
        var promise = new Promise;
        this._remove(this.name, selector, function(coll) {
            promise.resolve(coll);
        })
        return promise;
    },

    count: function(selector) {
        var promise = new Promise;
        this._count(this.name, selector, function(num) {
            promise.resolve(num);
        });
        return promise;
    }
});

module.exports = {
    Db: Db,
    Collection: Collection
}