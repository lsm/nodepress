var nun = require("./lib/nun"),
settings = genji.settings,
path = require('path'),
mongo = require('./lib/node-mongodb-native/lib/mongodb');

var dbServer = new mongo.Server(settings.db.host, settings.db.port, {});

var sections = {
    posts: '{{#posts}}<div class="np-post"><h2>{{title}}</h2><h4>{{created}}</h4>{{content}}</div>{{/posts}}'
}

function index(handler) {
    var ctx = {staticUrl: settings.staticUrl, posts: sections.posts};
    nun.render(path.join(__dirname, '/views/index.html'), ctx, {}, function (err, output) {
        if (err) {
            throw err;
        }
        var buffer = '';
        output.addListener('data', function (c) {
            buffer += c;
        })
        .addListener('end', function () {
            handler.send(buffer);
        });
    });
}

function save(handler) {
    handler.on('end', function(data) {
        data = JSON.parse(data);
        var db = new mongo.Db(settings.db.name, dbServer, {});
        if (!data.hasOwnProperty('_id')) {
            data.created = new Date();
        } else {
            data.modified = new Date();
        }
        db.open(function(err, db) {
            db.collection('posts', function(err, posts) {
                posts.insert(data, function(err, res) {
                    handler.send(res[0]._id);
                    db.close();
                });
            });
        });
    });   
}

function list(handler) {
    var db = new mongo.Db(settings.db.name, dbServer, {});
    db.open(function(err, db) {
       db.collection('posts', function(err, cPosts) {
           cPosts.find({}, {sort:[["created", -1]], limit:12}, function(err, posts) {
               posts.toArray(function(err, posts) {
                   handler.send(posts);
                   db.close();
               });
           });
       });
    });
    
}

function hello_world(handler) {
    handler.send('Hello world!');
}

function section(handler, args) {
    var sectionName = args[1];
    if (sections.hasOwnProperty(sectionName)) {
        handler.setHeader('Content-Type', 'text/html');
        handler.send(sections[sectionName]);
    } else {
        handler.error(404, 'Section "' + sectionName + '" not found');
    }
}

function _jsonHeader(handler) {
    handler.setHeader("Content-Type", "application/json; charset=utf-8");
    return true;
}

function debug(handler) {
    handler.staticFile(settings.baseDir+"/views/debuger.html");
}

module.exports = [
    ['^/$', index],
    ["^/debug$", debug],
    ['^/hello/$', hello_world],
    ['^/update/$', save, 'post'],
    ['^/_tpl/section/([a-zA-Z0-9]+)/$', section, 'get'],
    ['^/list/$', list, 'get', [_jsonHeader]],
    ['^/new/$', save, 'post']
];