/**
 * Helloworld example of nodepress
 */

// your function to handle the app logic
function helloworld() {
    this.sendHTML('Hello world\n');
}

// url routing rules
var urls = [
    ['^/$', helloworld],
    ['.*', function() {
            this.error(404, 'Content not found');
    }, 'notfound']
];

// your application is essentialy a group of settings that the framework can understand
var settings = {
    // host and port your server will listen to
    host: '127.0.0.1'
    ,port: 8000
    // middlewares used by underlaying framework (genji)
    ,middlewares: [
        {name:'response-time'},
        {name: 'error-handler'},
        {name:'logger', level: 'info'},
        {name: 'router', urls: urls}
    ]
};

// exports your settings of application
module.exports = settings;