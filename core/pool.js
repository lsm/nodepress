var EventEmitter = require('events').EventEmitter,
Base = require('../lib/genji/lib/genji/core/base').Base;


var sys = require('sys')

exports.Pool = Base(EventEmitter, {
    init: function(getConnection, size) {
        this._super();
        this._pool = [];
        this._queue = [];
        this.size = size;
        var me = this;
        getConnection(size, function(conn) {
            me.emit('back', conn);
        });
        this.addListener('back', function(conn) {
            if ( me._queue.length > 0) {
                me._queue.shift()(conn);
            } else {
                me._pool.push(conn);
            }
        });
    },

    give: function(callback) {
        if (this._pool.length > 0) {
            callback(this._pool.shift());
        } else {
            this._queue.push(callback);
        }
    }
});

