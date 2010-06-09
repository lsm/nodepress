var nun = require("./lib/nun"),
settings = genji.settings,
path = require('path'),
mongo = require('./lib/node-mongodb-native/lib/mongodb');

var dbServer = new mongo.Server(settings.db.host, settings.db.port, {});

var sections = {
    posts: '{{#posts}}<div class="np-post"><h2 class="np-post-title">{{title}}</h2>'
        +'<h4 class="np-post-date np-right">{{published}}</h4><div class="np-post-content">{{{content}}}</div>'
        +'<div class="np-post-tags">{{#tags}}<div class="np-post-tag">{{name}}</div>{{/tags}}</div></div>{{/posts}}'
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

function _now() {
    return (new Date()).getTime() + ''; // save as string
}

function save(handler) {
    handler.on('end', function(data) {
        data = JSON.parse(data);
        var db = new mongo.Db(settings.db.name, dbServer, {});
        if (!data.hasOwnProperty('_id')) {
            data.created = _now();
        } else {
            data.modified = _now();
        }
        if (data.hasOwnProperty('published') && data.published == 1) {
            data.published = _now();
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

function list(handler, skip, limit, tags) {
    var db = new mongo.Db(settings.db.name, dbServer, {});
    skip = parseInt(skip) ? skip : 0;
    limit = parseInt(limit) ? limit : 5;
    if (limit > 10 || limit < 1) limit = 5; // default
    db.open(function(err, db) {
       db.collection('posts', function(err, cPosts) {
           var query = {published: {$exists: true}};
           if (tags) {
               tags = tags.split(',');
               query.tags = {$all: tags};
           }
           cPosts.find(query, {sort:[["published", -1]], limit:limit, skip: skip}, function(err, posts) {
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
    handler.staticFile(settings.baseDir+"/views/debugger.html");
}
function rightjs(handler) {
    handler.staticFile(path.join(settings.baseDir, '/static/js/rightjs/rightjs-1.5.6.js'), null, function(err) {
        if (err) handler.error(404, 'File not found');
    });
}

module.exports = [
    ['^/$', index],
    ["^/debug$", debug],
    ["^/right\.js$", rightjs],
    ['^/hello/$', hello_world],
    ['^/update/$', save, 'post'],
    ['^/list/([0-9])+/([0-9])+/([^/.]+)/$', list, 'get', [_jsonHeader]],
    ['^/list/([0-9])+/([0-9])+/$', list, 'get', [_jsonHeader]],
    ['^/list/$', list, 'get', [_jsonHeader]],
    ['^/new/$', save, 'post']
];