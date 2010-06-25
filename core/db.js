/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var genji = require('../lib/genji/lib/genji');
var Class = genji.core.Class;

var mongoose = require('../lib/mongoose/mongoose').Mongoose;

mongo = require('../lib/node-mongodb-native/lib/mongodb');
var settings = genji.settings = {db: {host:'127.0.0.1', port:27017, name: 'nodepress'}};
var dbServer = new mongo.Server(settings.db.host, settings.db.port, {});
//var db = new mongo.Db(settings.db.name, dbServer, {});

var sys = require('sys');


var Collection = Class(function(name) {
   this.name = name;
}, {
    getConn: function() {
        return new mongo.Db(settings.db.name, dbServer, {});
    },
    open: function(callback) {
        var db = this.getConn();
        db.open(function(err, db) {
            if (err) throw err;
            db.collection(this.name, function(err, coll) {
                if (err) throw err;
                callback(db, coll);
            });
        });
    },
    save: function(data, callback) {
        this.open(function(db, coll) {
           coll.save();
        });
    }
});

var c = new Collection;
for (var x in c) {
//    sys.puts(x);
}

CustomPKFactory = function() {}
        CustomPKFactory.prototype = new Object();
        CustomPKFactory.createPk = function() {
          return 'alalala';
        }

mongoose.model('Post', {
    collection: 'posts',
    properties: ['id', 'title', {'tags': []}, 'content', 'published', 'created', 'modified'],
    indexes: ['title', 'tags', 'published'],
    setters : {
        id: function() {
            return 'woshia'
        }
    }
});

var db = mongoose.connect('mongodb://127.0.0.1/nodepress');

var Post = db.model('Post');

var p = new Post;
p.title = 'text1';
p.content = 'asdasd';
p.save(function(){
    sys.puts('Saved!');
    p.title = 'text2';
    p.save();
});