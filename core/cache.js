var Cache = function() {
    this._cache = {};
};

Cache.prototype = {
    set: function(key, value) {
        this._cache[key] = value;
    },

    get: function(key) {
        return this._cache[key];
    },

    has: function(key) {
        return this._cache.hasOwnProperty(key);
    },

    purge: function(key) {
        if (key) {
            delete this._cache[key];
        } else {
            this._cache = {};
        }
    }
};

module.exports = Cache;