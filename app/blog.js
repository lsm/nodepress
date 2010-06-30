var db = require('../core/db'),
Collection = db.Collection,
crypto = require('crypto');

function _md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

function _now() {
    return (new Date()).getTime() + ''; // save as string
}

var Post = Collection({
    save: function(data) {
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data.hasOwnProperty('_id')) {
            data.created = _now();
            data._id = _md5(data + data.created);
        } else {
            data.modified = _now();
        }
        if (data.hasOwnProperty('published') && data.published == 1) {
            data.published = _now();
        }
        return this._super(data);
    }
});

var urls;

function savePost() {

}

function listPost() {
    
}


'_api/blog/save/';
'_api/blog/list/';

var rest;

module.exports = {
    db: {Post: Post}
}