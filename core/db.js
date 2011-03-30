
/**
 * Module dependences
 * 
 */
var genji = require('genji'),
mongo = require('mongodb'),
Base = genji.pattern.Base,
Pool = genji.pattern.Pool,
extend = genji.pattern.extend,
Mime = genji.web.mime,
deferred = genji.pattern.control.deferred,
connPool, dbConfig, GridStore = mongo.GridStore;

function connect(server, callback) {
    var type = typeof server;
    if (type  == 'string') {
        mongo.connect(server, callback);
        return;
    } else if (type == 'object' && !Array.isArray(server)) {
        var db = new mongo.Db(server.dbname, new mongo.Server(server.host, server.port, server.serverOptions), server.dbOptions);
        db.open(callback);
        return;
    }
    throw new Error('Server configuration not correct.');
}

function getConn(dbConfig, num, callback) {
    for (var i = 0; i < num; i++) {
        if (Array.isArray(dbConfig)) {
            dbConfig.forEach(function(server) {
                connect(server, function(err, db) {
                    if (err) throw err;
                    callback(db);
                });
            });
        } else {
            connect(dbConfig, function(err, db) {
                if (err) throw err;
                callback(db);
            });
        }
    }
}

function init(dbConf, poolSize) {
    dbConfig = dbConf;
    if (poolSize > 0) {
        connPool = new Pool(function(num, callback) {
            getConn(dbConfig, num, callback);
        }, poolSize);
    }
}

var Db = Base(function(config) {
    this.config = config || dbConfig;
    this.pool = connPool;
}, {
    close: function() {
        if (this.pool) {
            // only pooled connection need to close manually
            this.pool.batch(function(db) {
                db.close();
            });
        }
    },
    
    freeDb: function(db) {
        if (this.pool) {
            this.pool.emit('back', db);
        } else {
            db.close();
        }
    },
    
    giveDb: function(callback) {
        if (this.pool) {
            this.pool.pop(function(db) {
                callback(null, db);
            });
        } else {
            var self = this;
            connect(this.config, function(err, db) {
                if (err) {
                    callback(err);
                    self.freeDb(db);
                    return;
                }
                callback(err, db);
            });
        }
    },

    giveCollection: function(name, callback) {
        var self = this;
        this.giveDb(function(err, db) {
            if (err) {
                callback(err);
                return;
            }
            db.collection(name, function(err, coll) {
                if (err) {
                    callback(err);
                    self.freeDb(db);
                    return;
                }
                callback(err, coll);
            });
        });
    },

    _find: function(collectionName, selector, fields, options, callback) {
        var self = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
                return;
            }
            coll.find(selector, fields, options, function(err, cursor) {
                if (err) {
                    callback(err);
                    self.freeDb(coll.db);
                    return;
                }
                cursor.toArray(function(err, result) {
                    callback(err, result);
                    self.freeDb(cursor.db);
                });
            });
        });
    },

    _findEach: function(collectionName, selector, fields, options, callback) {
        var self = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
                return;
            }
            coll.find(selector, fields, options, function(err, cursor) {
                if (err) {
                    callback(err);
                    self.freeDb(coll.db);
                    return;
                }
                cursor.each(function(err, result) {
                    if (err) {
                        callback(err, null);
                        self.freeDb(cursor.db);
                        return;
                    }
                    if (result !== null) {
                        callback(null, result);
                    } else {
                        // end of result
                        callback(null, null);
                        self.freeDb(cursor.db);
                    }
                });
            });
        });
    },

    _findOne: function(collectionName, selector, options, callback) {
        var me = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.findOne(selector, options, function(err, result) {
                    callback(err, result);
                    me.freeDb(coll.db);
                });
            }
        });
    },

    _findAndModify: function(collectionName, selector, sort, update, options, callback) {
        var me = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.findAndModify(selector, sort, update, options, function(err, doc) {
                    callback(err, doc);
                    me.freeDb(coll.db);
                });
            }
        });
    },

    _save: function(collectionName, data, options, callback) {
        var me = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.save(data, options, function(err, doc) {
                    callback(err, doc);
                    me.freeDb(coll.db);
                });
            }
        });
    },

    _update: function(collectionName, spec, doc, options, callback) {
        var self = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.update(spec, doc, options, function(err, updated) {
                    callback(err, updated);
                    self.freeDb(coll.db);
                });
            }
        });
    },

    _remove: function(collectionName, selector, callback) {
        var me = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.remove(selector, function(err, coll) {
                    callback(err, coll);
                    me.freeDb(coll.db);
                });
            }
        });
    },

    _count: function(collectionName, selector, callback) {
        var me = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.count(selector, function(err, num) {
                    callback(err, num);
                    me.freeDb(coll.db);
                });
            }
        });
    },

    _ensureIndex: function(collectionName, fieldOrSpec, unique, callback) {
        var self = this;
        this.giveDb(function(err, db) {
            if (err) {
                callback(err);
            } else {
                db.ensureIndex(collectionName, fieldOrSpec, unique, function(err, res) {
                    callback(err, res);
                    self.freeDb(db);
                });
            }
        });
    },

    _distinct: function(collectionName, key, query, callback) {
        var self = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.distinct(key, query, function(err, res) {
                    callback(err, res);
                    self.freeDb(coll.db);
                });
            }
        });
    },

    _mapReduce: function(collectionName, map, reduce, options, callback) {
        var self = this;
        this.giveCollection(collectionName, function(err, coll) {
            if (err) {
                callback(err);
            } else {
                coll.mapReduce(map, reduce, options, function(err, coll) {
                    callback(err, coll);
                    self.freeDb(coll.db);
                });
            }
        });
    }
});

var Collection = Db({
    init: function(name) {
        this._super();
        this.name = name;
    },
    
    find: function(selector, fields, options) {
        var _find = deferred(this._find, this);
        return _find(this.name, selector, fields, options);
    },

    findEach: function(selector, fields, options) {
        return deferred(this._findEach, this)(this.name, selector, fields, options);
    },

    findOne: function(selector, options) {
        return deferred(this._findOne, this)(this.name, selector, options || {});
    },

    findAndModify: function(selector, sort, update, options) {
        return deferred(this._findAndModify, this)(this.name, selector, sort, update, options || {});
    },

    save: function(data, options) {
        return deferred(this._save, this)(this.name, data, options);
    },

    update: function(spec, doc, options) {
        return deferred(this._update, this)(this.name, spec, doc, options);
    },

    remove: function(selector) {
        return deferred(this._remove, this)(this.name, selector);
    },

    count: function(selector) {
        return deferred(this._count, this)(this.name, selector);
    },

    ensureIndex: function(spec, unique) {
        return deferred(this._ensureIndex, this)(this.name, spec, unique);
    },

    distinct: function(key, query) {
        return deferred(this._distinct, this)(this.name, key, query);
    }
});

var GridFS = Db({
    init: function(rootCollection) {
        this._super();
        this.root = rootCollection || 'fs';
        this.filesCollection = this.root + '.files';
    },

    _getGridStore: function(filename, mode, options, callback) {
        mode = mode || 'r';
        options = extend(options || {}, {root: this.root});
        var self = this;
        this.giveDb(function(err, db) {
            if (err) {
                callback(err);
                self.freeDb(db);
                return;
            }
            callback(null, new GridStore(db, filename, mode, options));
        });
    },

    _copyFromFile: function(path, filename, callback) {
        var self = this, mimeType = Mime.lookup(path);
        this._getGridStore(filename, 'w', {content_type: mimeType}, function(err, gs) {
            if (err) {
                callback(err);
                self.freeDb(gs.db);
                return;
            }
            gs.writeFile(path, function(err, gs) {
                callback(err, gs);
                self.freeDb(gs.db);
            });
        });
    },

    copyFromFile: function(path, filename) {
        return deferred(this._copyFromFile, this)(path, filename);
    },

    _exists: function(selector, callback) {
        this._findOne(this.filesCollection, selector, {fields: {_id: 1, filename: 1}}, function(err, file) {
            if (err) {
                callback(err);
            } else {
                callback(null, file ? true : false, file);
            }
        });
    },

    exists: function(selector) {
        return deferred(this._exists, this)(selector);
    },

    readFile: function(selector, options) {
        var self = this,
        _readFile = function(selector, options, callback) {
            self._findOne(self.filesCollection, selector, options, function(err, file) {
            if (err) {
                return callback(err);
            }
            if (!file) {
                callback('file not found');
                return;
            }
            self._getGridStore(file.filename, 'r', null, function(err, gs) {
                    if (err) {
                        return callback(err);
                    }
                    gs.open(function(err, gs) {
                        if (err) {
                            callback(err);
                            self.freeDb(gs.db);
                            return;
                        }
                        gs.read(function(err, contents) {
                            callback(err, contents, file);
                            self.freeDb(gs.db);
                        });
                    });
                });
            });
        }
        return deferred(_readFile, this)(selector, options || {});
    },
    
    writeFile: function(filename, data, mode, options) {
        var self = this
        , _writeFile = function(filename, data, mode, options, callback) {
            self._getGridStore(filename, mode, options, function(err, gs) {
                if (err) {
                    callback(err);
                    self.freeDb(gs.db);
                    return;
                }
                gs.open(function(err, gs) {
                    if (err) {
                        callback(err);
                        self.freeDb(gs.db);
                        return;
                    }
                    gs.write(data, true, function(err, gs) {
                        callback(err, gs);
                        self.freeDb(gs.db);
                    });
                });
            });
        };
        mode = mode || 'w';
        options = options || {};
        options['content_type'] = options['content_type'] || Mime.lookup(filename);
        return deferred(_writeFile, this)(filename, data, mode, options);
    }
});

module.exports = {
    init: init,
    Db: Db,
    Collection: Collection,
    GridFS: GridFS,
    ObjectID: mongo.BSONPure.ObjectID
}