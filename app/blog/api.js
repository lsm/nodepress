var core = require('../../core'),
auth = core.auth,
view = core.view,
factory = core.factory,
post = factory.post;

function save() {
    var self = this;
    self.on('end', function(data) {
        post.save(data, self.user).then(function(doc) {
            self.sendJSON({
                _id: doc._id
            });
            core.event.emit('blog.api.save', doc);
        });
    });
}

function list(skip, limit, tags) {
    var self = this;
    skip = parseInt(skip) ? skip : 0;
    limit = parseInt(limit) ? limit : 5;
    if (limit > 30 || limit < 1) limit = 5; // default
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
            self.sendJSON({
                posts: result,
                total: num
            });
            core.event.emit('blog.api.list', query, options, result);
        });
    });
}

function byId(id) {
    var self = this;
    post.findOne({
        _id: id
    }).then(function(data) {
        self.sendJSON(data);
        core.event.emit('blog.api.id', id, data);
    });
}

var api = [
['blog/save/', [auth.checkLogin, save], 'post'],
['blog/list/([0-9]+)/([0-9]+)/(.*)/$', list, 'get'],
['blog/list/([0-9]+)/([0-9]+)/$', list, 'get'],
['blog/list/$', list, 'get'],
['blog/id/([0-9a-fA-F]+)/$', byId, 'get']
];

module.exports = api;