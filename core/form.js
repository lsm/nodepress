var formidable = require('formidable');
var genji = require('genji');
var Handler = genji.require('handler').Handler;
var Path = require('path');
var defaultExtentions = ['.png', '.jpg', '.jpeg'];
var maxFieldsSize = 8 * 1024 * 1024;

var FormHandler = Handler({
  init: function(context) {
    this._super(context);
    this.exts = defaultExtentions;
    this.maxFieldsSize = maxFieldsSize;
  },

  parse: function(callback) {
    var form = new formidable.IncomingForm(),
      files = [], fields = {}, self = this;
    form.maxFieldsSize = this.maxFieldsSize;
    form.keepExtensions = true;
    form
      .on('field', function(field, value) {
      var val = fields[field];
      if (val) {
        fields[field] = Array.isArray(val) ? val.concat(value) : [val, value];
      } else {
        fields[field] = value;
      }
    })
      .on('file', function(field, file) {
        if (self.isAllowedExt(file.name)) {
          file.field = field;
          files.push(file);
        } else {
          console.log('file extention %s not allowed', Path.extname(file.name));
        }
      })
      .on('end', function() {
        if (callback) {
          callback(null, fields, files.length > 0 ? files : null);
        }
        self.emit('end', fields, files.length > 0 ? files : null);
      })
      .on('error', function(err) {
        if (callback) {
          callback(err);
        }
        self.emit('error', err);
      });
    form.parse(this.request);
    return this;
  },

  setAllowedExts: function(exts) {
    this.exts = exts;
    return this;
  },

  setMaxFieldsSize: function(size) {
    this.maxFieldsSize = size;
    return this;
  },

  isAllowedExt: function(filename) {
    return this.exts.indexOf(Path.extname(filename)) > -1;
  }
});

module.exports = FormHandler;