var db = require('./core/db'),
client = require('./core/client'),
settings = genji.settings,
apps = [],
apis = [],
urls = [];

settings.installedApps.forEach(function(app) {
    apps.push(require('./app/' + app));
});

apps.forEach(function(app) {
    if (app.hasOwnProperty('api')) {
        apis = apis.concat(app['api']);
    }
    if (app.hasOwnProperty('db')) {
        for (var name in app['db']) {
            db[name] = app['db'][name];
        }
    }
    if (app.hasOwnProperty('view')) {
        urls = urls.concat(app['view']);
    }
    if (app.hasOwnProperty('client')) {
        client.inject(app.client);
    }
});

urls.push(['^/_api/', apis]);

module.exports = urls;
    