var db = require('../core/db'),
auth = require('../core/auth'),
Collection = db.Collection,
tracker;

var setting = new Collection('settings');

function getTracker(handler, callback) {
    function send(tracker) {
        if (callback) {
            callback(tracker);
        } else {
            handler.send(tracker.code);
        }
    }
    if (tracker) {
        send(tracker);
        return;
    }
    setting.findOne({
        '_id': 'defaultTracker'
    }).then(function(trackerObj) {
        tracker = trackerObj || {
            code: ''
        };
        send(tracker);
    });
}

function saveTracker(handler) {
    handler.on('end', function(data) {
        setting.save({
            _id: 'defaultTracker',
            code: data
        }).then(function() {
            tracker = {
                code: data
            };
            handler.send('ok');
        });
    });
}

getTracker(null, function() {});

var api = [
    ['management/tracker/get/$', getTracker, 'get', [auth.checkLogin]],
    ['management/tracker/save/$', saveTracker, 'post', [auth.checkLogin]]
]

module.exports = {
    db: {
        setting: setting
    },
    api: api,
    getTracker: getTracker
//    view: _view
}