var core = require('../core'),
db = core.db,
auth = core.auth,
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

function saveSetting(handler) {
    handler.on('end', function(data) {
       data = JSON.parse(data);
       setting.save(data).then(function() {
           handler.send('Setting saved');
       });
    });
}

getTracker(null, function() {});

var api = [
    ['management/tracker/get/$', getTracker, 'get', [auth.checkLogin]],
    ['management/tracker/save/$', saveTracker, 'post', [auth.checkLogin]],
    ['management/setting/save/$', saveSetting, 'post', [auth.checkLogin]]
]

module.exports = {
    db: {
        setting: setting
    },
    api: api,
    getTracker: getTracker
//    view: _view
}