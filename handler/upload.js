var formidable = require('formidable'),
genji = require('genji'),
Handler = genji.web.handler.Handler;
Simple = require('genji/web/handler/simple'),
Cookie = require('genji/web/handler/cookie'),
Path = require('path'),
defaultExtentions = ['.png', '.jpg'];

var UploadHandler = Handler({
    init: function(context) {
        var form = new formidable.IncomingForm(),
        files = [], self = this;
        form.keepExtensions = true;
        this._super(context);
        this.exts = defaultExtentions;
        
        form.on('file', function(field, file) {
            if (self.isAllowedExt(file.name)) {
                file.field = field;
                files.push(file);
            } else {
                console.log('file extention %s not allowed', Path.extname(file.name));
            }
        })
        .on('end', function() {
            self.emit('end', files);
        });
        form.parse(context.request);
    },

    setAllowedExts: function(exts) {        
        this.exts = exts;
    },

    isAllowedExt: function(filename) {
        return this.exts.indexOf(Path.extname(filename)) > -1;
    },

    // we only need instance methods except `init` of `Simple` module
    include: {
        send: Simple.send,
        sendJSON: Simple.sendJSON,
        sendHTML: Simple.sendHTML
    }
});

// allow it to parse cookies
UploadHandler.include(Cookie);

module.exports = UploadHandler;