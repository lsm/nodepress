var core = require('../core'),
db = core.db,
auth = core.auth,
checkLogin = auth.checkLogin,
Collection = db.Collection,
tracker;

var setting = new Collection('settings');

function getTracker(callback) {
    var self = this;
    function send(tracker) {
        if (callback) {
            callback(tracker);
        } else {
            self.send(tracker.code);
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

function saveTracker() {
    var self = this;
    self.on('end', function(data) {
        setting.save({
            _id: 'defaultTracker',
            code: data
        }).then(function() {
            tracker = {
                code: data
            };
            self.send('ok');
        });
    });
}

function saveSetting() {
    var self = this;
    self.on('end', function(data) {
        data = JSON.parse(data);
        setting.save(data).then(function() {
            core.event.emit('management.api.saveSetting', data);
            self.send('Setting saved');
        });
    });
}

// get tracker code from db
getTracker(function() {});

var api = [
    [
        'management/',
        [
            ['tracker/get/$', getTracker, 'get'],
            ['tracker/save/$', saveTracker, 'post'],
            ['setting/save/$', saveSetting, 'post']
        ],
        {pre: [checkLogin]}
    ]
]

// client side code
function management($) {
    var np = $.np;
    var dom = np.dom;
    $.extend(np.api, {
        getTracker: function() {
            $.ajax({
                url: '/_api/management/tracker/get/',
                type: 'GET',
                dataType: 'text',
                success: function(data) {
                    np.emit('@ApiGetTracker', [data]);
                },
                error: function(xhr, status) {
                    np.emit('#AjaxError', ["Can't get tracker code", xhr, status]);
                }
            });
        },

        saveTracker: function() {
            $.ajax({
                url: '/_api/management/tracker/save/',
                type: 'POST',
                data: dom.tracker.attr('value'),
                dataType: 'text',
                success: function(data) {
                    np.emit('@ApiSaveTracker');
                },
                error: function(xhr, status) {
                    np.emit('#AjaxError', ["Failed to save tracker code", xhr, status]);
                }
            });
        },

        saveSetting: function() {
            $.ajax({
                url: '/_api/management/setting/save/',
                type: 'POST',
                data: JSON.stringify({
                    _id: 'site',
                    title: dom.siteTitle.attr('value'),
                    intro: dom.siteIntro.attr('value')
                }),
                dataType: 'text',
                success: function(data) {
                    np.emit('@ApiSaveSetting');
                },
                error: function(xhr, status) {
                    np.emit('#AjaxError', ["Failed to save settings", xhr, status]);
                }
            });
        }
    });
    np.on('@ApiGetTracker', function(e, data) {
        dom.tracker.attr('value', data);
    });
    np.on('@ApiSaveSetting', function() {
        np.growl({
            title: 'Setting saved successfully.',
            text: ' '
        })
    });
}

module.exports = {
    db: {
        setting: setting
    },
    client: {
        'user.js': {
            'app.management': {
                weight: 100,
                code: management
            }
        },
        'initUser.js': {
            'app.management': {
                weight: 100,
                code: function($) {
                    var np = $.np;
                    var dom = np.dom;
                    // tracker
                    dom.tracker = $('#np-tracker'),
                    dom.saveSetting = $('#np-save-setting');
                    dom.saveTracker = $('#np-save-tracker');
                    dom.siteTitle = $('#np-siteTitle');
                    dom.siteIntro = $('#np-siteIntro');
                    np.api.getTracker();
                    dom.saveTracker.click(np.api.saveTracker);
                    dom.saveSetting.click(np.api.saveSetting);
                }
            }
        }
    },
    api: api,
    getTracker: getTracker
}