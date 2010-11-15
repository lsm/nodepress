var core = np,
account = require('../account'),
auth = core.auth,
view = core.view,
factory = core.factory,
post = factory.post;

function save() {
    var self = this;
    self.on('end', function(data) {
        post.save(data, self.username).then(function(doc) {
            self.sendJSON({
                _id: doc._id
            });
            core.event.emit('blog.api.save', doc);
        });
    });
}

function remove() {
    var self = this;
    this.on('end', function(data) {
        var doc = JSON.parse(data);
        post.remove({_id: new core.db.ObjectID(doc._id)}).then(function(doc) {
           self.sendJSON({});
           core.emit('blog.api.remove', doc);
        });
    });
}

function list(skip, limit, tags) {
    var self = this;
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
        _id: new core.db.ObjectID(id)
    }).then(function(data) {
        self.sendJSON(data);
        core.event.emit('blog.api.id', id, data);
    });
}

var api = [
['blog/save/$', [account.checkLogin, save], 'post'],
['blog/remove/$', [account.checkLogin, remove], 'post'],
['blog/list/([0-9]+)/([0-9]+)/(.*)/$', list, 'get'],
['blog/list/([0-9]+)/([0-9]+)/$', list, 'get'],
['blog/list/$', list, 'get'],
['blog/id/([0-9a-fA-F]{24})/$', byId, 'get']
];

module.exports = api;