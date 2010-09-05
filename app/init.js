// views
var _view = [
    ['.*', function() {
            // default 404 handler
            this.error(404, '`' + this.request.url + '` not found');
    }, 'notfound']
]

// This the clientside bootstrip script that all apps depend on.
function mainInitJs($) {
    // global nodepress object
    var np = $.np = {};
    var event = np._event = $({});
    // the messaging hub
    np.$ = $; // jQuery need this to work
    np.emit = function(eventType, extraParameters) {
        event.trigger(eventType, extraParameters);
    }
    np.on = function() {
        event.bind.apply(event, arguments);
    }
    // cache all the dom object here
    np.dom = {};
    // growl like notification widget (jquery-gritter)
    np.growl = $.gritter.add;
    // Rest api
    np.api = {};
    // params for querying aginst remote apis
    np.params = {};

    // handle ajax error
    np.on('#AjaxError', function(event, title, xhr, status) {
        $.np.growl({
            title: title,
            sticky: true,
            text: xhr.responseText
        });
    });
}

module.exports = {
    client: {
        "main.js": {
            "app.init": {
                // run before other apps
                weight: 0,
                code: mainInitJs
            }
        }
    },
    view: _view
}