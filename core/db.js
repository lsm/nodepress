
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
    connPool = new Pool(getConn, poolSize || 5);
}


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
        var self = this;
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
    }
});

module.exports = {
    init: init,
    Db: Db,
    Collection: Collection
}