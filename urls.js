var core = require('./core'),
db = core.db,
client = core.client,
settings = genji.settings,
apps = [],
apis = [],
urls = [];

core.app = {};

settings.installedApps.forEach(function(app) {
    var module, name;
    if (typeof app == 'string') {
         module = require('./app/' + app);
         name = app;
    } else if (typeof app == 'object') {
        module = require(app.require);
        name = app.name;
    } else {
        throw new Error('setting format of `installedApps` not correct.');
    }
    core.app[name] = module;
    apps.push(module);
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
    