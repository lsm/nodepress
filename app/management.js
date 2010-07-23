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

function clientCode() {
    return function($) {
        var np = $.np,
        emitter = np.emitter;
        $.extend($.np.api, {
            getTracker: function() {
                $.ajax({
                    url: '/_api/management/tracker/get/',
                    type: 'GET',
                    dataType: 'text',
                    success: function(data) {
                        emitter.trigger('@ApiGetTracker', [data]);
                    },
                    error: function(xhr, status) {
                        emitter.trigger('#ApiGetTracker', [xhr, status]);
                    }
                });
            },

            saveTracker: function() {
                $.ajax({
                    url: '/_api/management/tracker/save/',
                    type: 'POST',
                    data: np.tracker.attr('value'),
                    dataType: 'json',
                    success: function(data) {
                        emitter.trigger('@ApiSaveTracker');
                    },
                    error: function(xhr, status) {
                        emitter.trigger('#ApiSaveTracker', [xhr, status]);
                    }
                });
            },

            saveSetting: function() {
                $.ajax({
                    url: '/_api/management/setting/save/',
                    type: 'POST',
                    data: {
                        _id: 'site',
                        title: np.siteTitle.attr('value'),
                        intro: np.siteIntro.attr('value')
                    },
                    dataType: 'json',
                    success: function(data) {
                        emitter.trigger('@ApiSaveSetting');
                    },
                    error: function(xhr, status) {
                        emitter.trigger('#ApiSaveSetting', [xhr, status]);
                    }
                });
            }
        });
        emitter.bind('@ApiGetTracker', function(e, data) {
            np.tracker.attr('value', data);
        });

    };
}

module.exports = {
    db: {
        setting: setting
    },
    client: {
        'main.js': {
            'management': {
                weight: 100,
                code: clientCode(),
                validUser: true
            }
        },
        'init.js': {
            'management': {
                weight: 100,
                code: function($) {
                    var np = $.np;
                    // tracker
                    np.tracker = $('#np-tracker'),
                    np.saveSetting = $('#np-save-setting');
                    np.saveTracker = $('#np-save-tracker');
                    np.api.getTracker();
                    np.saveTracker.click(np.api.saveTracker);
                    np.saveSetting.click(np.api.saveSetting);
                },
                validUser: true
            }
        }
    },
    api: api,
    getTracker: getTracker
//    view: _view
}