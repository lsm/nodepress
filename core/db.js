
/**
 * Module dependences
 * 
 */
var genji = require('genji'),
mongo = require('mongodb'),
Base = genji.pattern.Base,
Pool = genji.pattern.Pool,
promise = genji.pattern.control.promise,
connPool, servers;


function getConn(num, callback) {
    for (var i = 0; i < num; i++) {
        mongo.connect(servers, function(err, db) {
            if (err) throw err;
            callback(db);
        });
    }
}

function init(dbServers, poolSize) {
    servers = dbServers;
    if (poolSize > 0) {
        connPool = new Pool(getConn, poolSize || 5);
    }
}

var Db = Base(function() {
     this.pool = connPool;
}, {
    freeDb: function(db) {
        if (this.pool) {
            this.pool.emit('back', db);
        } else {
            db.close();
        }
    },
    
    giveDb: function(callback) {
        if (this.pool) {
            this.pool.pop(callback);
        } else {
            mongo.connect(servers, function(err, db) {
                if (err) throw err;
                callback(db);
            });
        }
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
        this._findEach(collectionName, selector, fields, options, function(cursor) {
            cursor.toArray(function(err, result) {
               if (err) throw err;
               callback(result);
            });
        });
    },

    _findEach: function(collectionName, selector, fields, options, callback) {
        var self = this;
        this.giveCollection(collectionName, function(coll) {
            coll.find(selector, fields, options, function(err, cursor) {
                if (err) throw err;
                var fetchAll = cursor.fetchAllRecords;
                cursor.fetchAllRecords = function(callback) {
                    fetchAll.call(cursor, function(err, result) {
                        callback(err, result);
                        if(!cursor.cursorId.greaterThan(cursor.db.bson_serializer.Long.fromInt(0))) {
                            // free db when there's no data to fetch
                            // only works for `fetchAllRecords`, `toArray`, `each`, `nextObject`, `fetchFirstResults`
                           self.freeDb(cursor.db);
                        }
                    });
                }
                callback(cursor);
            });
        });
    },

    _findOne: function(collectionName, selector, options, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.findOne(selector, options, function(err, result) {
                if (err) throw err;
                callback(result);
                me.freeDb(coll.db);
            });
        });
    },

    _save: function(collectionName, data, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.save(data, function(err, doc) {
                if (err) throw err;
                callback(doc);
                me.freeDb(coll.db);
            });
        });
    },

    _remove: function(collectionName, selector, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.remove(selector, function(err, coll) {
                if (err) throw err;
                callback(coll);
                me.freeDb(coll.db);
            });
        });
    },

    _count: function(collectionName, selector, callback) {
        var me = this;
        this.giveCollection(collectionName, function(coll) {
            coll.count(selector, function(err, num) {
                if (err) throw err;
                callback(num);
                me.freeDb(coll.db);
            });
        });
    },

    _ensureIndex: function(collectionName, fieldOrSpec, unique, callback) {
        var self = this;
        this.giveDb(function(db) {
            db.ensureIndex(collectionName, fieldOrSpec, unique, function(err, res) {
                if (err) throw err;
                callback(res);
                self.freeDb(db);
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
        var _find = promise(this._find, this);
        return _find(this.name, selector, fields, options);
    },

    findEach: function(selector, fields, options) {
        return promise(this._findEach, this)(this.name, selector, fields, options);
    },

    findOne: function(selector, options) {
        return promise(this._findOne, this)(this.name, selector, options || {});
    },

    save: function(data) {
        return promise(this._save, this)(this.name, data);
    },

    remove: function(selector) {
        return promise(this._remove, this)(this.name, selector);
    },

    count: function(selector) {
        return promise(this._count, this)(this.name, selector);
    },

    ensureIndex: function(spec, unique) {
        return promise(this._ensureIndex, this)(this.name, spec, unique);
    }
});

module.exports = {
    init: init,
    Db: Db,
    Collection: Collection
}