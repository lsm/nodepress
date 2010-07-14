// exports modules
exports.auth = require('./auth'),
    exports.db = require('./db'),
    exports.promise = require('./promise'),
    exports.view = require('./view');

// nodepress global object
genji.np = {};

// setup cache, event emitter and filter.
genji.np.cache = new genji.cache.Memory;
genji.np.event = new genji.core.Event;
genji.np.filter = new genji.pattern.Filter;