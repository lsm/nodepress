var account = require('../account'),
auth = np.auth,
view = np.view;

var api = np.genji.app('api', {root: '^/_api/'});

function save(handler) {
    handler.on('end', function(params, raw) {
        var doc = JSON.parse(raw);
        post.save(doc, handler.username).then(function(doc) {
            handler.sendJSON({
                _id: doc._id
            });
            core.event.emit('blog.api.save', doc);
        }).fail(function(err) {
            console.log(err.stack);
        });
    });
}

function remove(handler) {
    handler.on('end', function(params, data) {
        var doc = JSON.parse(data);
        post.remove({_id: new core.db.ObjectID(doc._id)}).then(function(doc) {
           handler.sendJSON({});
           core.emit('blog.api.remove', doc);
        });
    });
}

function list(handler, skip, limit, tags) {
    skip = parseInt(skip) ? skip : 0;
    limit = parseInt(limit) ? limit : core.blog.DEFAULT_POST_NUM;
    if (limit > 30 || limit < 1) limit = core.blog.DEFAULT_POST_NUM; // default
    var query = {
        published: {
            $exists: true
        }
    };

    if (tags) {
        tags = decodeURIComponent(tags).split(',');
        query.tags = {
            $all: tags
        };
    }

    var options = {
        sort:[["published", -1]],
        limit:limit,
        skip: skip
    }

    post.count(query).then(function(num) {
        post.find(query, null, options).then(function(result) {
            handler.sendJSON({
                posts: result,
                total: num
            });
            core.event.emit('blog.api.list', query, options, result);
        });
    });
}

function byId(handler, id) {
    post.findOne({
        _id: new core.db.ObjectID(id)
    }).then(function(data) {
        handler.sendJSON(data);
        core.event.emit('blog.api.id', id, data);
    });
}

api.mount([
['blog/save/$', [account.checkLogin, save], 'post'],
['blog/remove/$', [account.checkLogin, remove], 'post'],
['blog/list/([0-9]+)/([0-9]+)/(.*)/$', list, 'get'],
['blog/list/([0-9]+)/([0-9]+)/$', list, 'get'],
['blog/list/$', list, 'get'],
['blog/id/([0-9a-fA-F]{24})/$', byId, 'get']
]);