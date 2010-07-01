


function hello_world(handler) {
    handler.send('Hello world');
}

var blog = require('./app/blog');
var account = require('./app/account');
var management = require('./app/management');

var apis = [];

apis = apis.concat(blog.api);
apis = apis.concat(management.api);

var urls = [
    ['^/_api/', apis],
    ['^/hello/$', hello_world],
    ];

urls = urls.concat(blog.view);
urls = urls.concat(account.view);

module.exports = urls;
    