var path = require('path'),
genji = require('genji');
var settings = {
    view: {
        viewRoot: path.join(__dirname, '/view'),
        compress: false,
        cache: false
    }
    ,env: 'development'
    ,appRoot: __dirname
    ,host: '127.0.0.1'
    ,port: 8000
    ,installedApps: [{name: 'HelloWorld', require: path.join(__dirname, '/app/hello')}]
    ,middlewares: [
        {name:'response-time'},
        {name: 'error-handler'},
        {name:'logger', level: 'info'},
        {name:'conditional-get'},
        {name: 'router', handler: genji.web.handler.SimpleHandler}
    ]
};

try {
    var local_settings = require('./settings');
    for (var key in local_settings) {
        settings[key] = local_settings[key];
    }
} catch(e) {}


module.exports = settings;