var db = np.db;
var auth = np.auth;
var checkLogin = np.app.account.checkLogin;
var tracker;

var api = np.genji.app('api', {root: '^/_api/'});

var setting = db.collection('settings');


function getTracker(handler, callback) {
  function send(tracker) {
    if (callback) {
      callback(tracker);
    } else {
      handler && handler.send(tracker.code);
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
  handler.on('data', function(buff) {
    var data = buff.toString('utf8');
    setting.save({
      _id: 'defaultTracker',
      code: data
    }).then(function(doc) {
        tracker = {
          code: data
        };
        handler.send('ok');
        np.emit('management.api.saveTracker', doc);
      });
  });
}

function saveSetting(handler) {
  handler.on('json', function(json) {
    setting.save(json).then(function() {
      handler.send('Setting saved');
      np.emit('management.api.saveSetting', json);
    });
  });
}

// get tracker code from db
getTracker(null, function() {
});

api.mount([
  ['management/',
    [
      ['tracker/get/$', getTracker, 'get'],
      ['tracker/save/$', saveTracker, 'post'],
      ['setting/save/$', saveSetting, 'post']
    ],
    {pre: [checkLogin]}
  ]
]);


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

// bind global events
np.on('management.api.saveSetting', function(data) {
  if (data._id == 'site') {
    if (data.title) np.cache.set('title', data.title);
    if (data.intro) np.cache.set('intro', data.intro);
  }
});

np.on('management.api.saveTracker', function(data) {
  if (data) np.cache.set('defaultTracker', data.code);
});

np.script.addJsCode('js/user.js', management, 'main');
np.script.addJsCode('js/initUser.js', function initUserDomJs($) {
  var np = $.np;
  var dom = np.dom;
  // tracker
  dom.tracker = $('#np-tracker');
  dom.saveSetting = $('#np-save-setting');
  dom.saveTracker = $('#np-save-tracker');
  dom.siteTitle = $('#np-siteTitle');
  dom.siteIntro = $('#np-siteIntro');
  np.api.getTracker();
  dom.saveTracker.click(np.api.saveTracker);
  dom.saveSetting.click(np.api.saveSetting);
}, 'inline');

module.exports = {
  getTracker: getTracker
};