var core = require('../../core'),
Collection = core.db.Collection,
factory = core.factory,
_now = core.util.now,
md5 = genji.util.crypto.md5;


factory.register('post', function(name) {
    return new Collection(name)
    }, ['posts'], true);
var post = factory.post;
post.extend({
    save: function(data, author) {
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data.hasOwnProperty('_id')) {
            data.created = _now();
            data.author = author;
            data._id = md5(data);
        } else {
            data.modified = _now();
        }
        if (data.hasOwnProperty('published') && data.published == 1) {
            data.published = _now();
        }
        return this._super(data);
    }
});


module.exports = {
    db: {
        post: post
    },
    client: require('./client'),
    api: require('./api'),
    view: require('./view'),
    DEFAULT_POST_NUM: 20
}