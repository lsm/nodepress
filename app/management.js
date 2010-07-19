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

        var lastContent;
       /**
        * convert markdown and show the converted in preview div
        *
        * @param {Object} input Input element (jQuery)
        * @param {Object} preview Preview element (jQuery)
        * @param {Object} showdown Instance of showdown
        */
        $.np.preview = function(input, preview) {
            var content = input.attr('value');
            content = content === lastContent ? false : content;
            if (content !== false) {
                lastContent = content;
                preview.attr('innerHTML', $.np.showdown.makeHtml(content));
            }
        }

        $.np.resetEditor = function() {
            $.each([np.title, np.tags, np.input], function(idx, item) {
                item.attr('value', '');
            });
            np.previewDiv.attr('innerHTML', '');
            postId = null;
        }

        $.np.fillEditor = function(id) {
            function fill(data) {
                published = data.published;
                created = data.created;
                np.title.attr('value', data.title);
                np.input.attr('value', data.content);
                np.tags.attr('value', data.tags.join(','));
            }
            if (np.data.posts) {
                $.each(np.data.posts, function(idx, el) {
                    postId = id;
                    if (el._id === postId) {
                        fill(el);
                    }
                });
            }
            $.ajax({
                url: '/_api/blog/id/' + id + '/',
                type: 'GET',
                dataType: 'json',
                success: function(data, status) {
                    fill(data);
                },
                error: function(xhr, status) {
                    growl({
                        title: 'Failed to load post',
                        text: 'id: ' + id
                    });
                }
            });
        }
    };
}

module.exports = {
    db: {
        setting: setting
    },
    client: {
        filename: 'main.js',
        name: 'management',
        position: 'after#blog',
        code: clientCode()
    },
    api: api,
    getTracker: getTracker
//    view: _view
}