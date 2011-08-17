var Path = require('path');
var fs = require('fs');
var crypto = require('genji').require('crypto');
var ugjs = require('uglify-js');
var jsp = ugjs.parser;
var pro = ugjs.uglify;


/**
 * Initialize module with settings
 *
 * @param settings
 */
function Script(settings) {
  this.staticUrl = settings.staticUrl;
  this.staticRoot = settings.staticRoot || Path.join(__dirname, '../static');
  this.scripts = {};
  this.scriptIndexes = [];
}

Script.prototype = {
  /**
   * Add a javascript file
   *
   * @param {String} url Url of your js file relative to `staticUrl`
   * @param {String|Array} group Group(s) of this js
   * @param {String} path Path of the js file relative to `staticRoot`, defaults to `url` if ignored.
   */
  addJs: function addJs(url, group, path) {
    addScript.call(this, url, group, path, 'js');
  },

  /**
   * Add a css file
   *
   * @param url
   * @param group
   * @param path
   */
  addCss: function addCss(url, group, path) {
    addScript.call(this, url, group, path, 'css');
  },

  /**
   * Get the js script tags use to include javascript in your html file
   * this is handled by head.js by default
   *
   * @param {String|Array} group Name of the script group(s) (e.g. 'user', ['guest', 'user'])
   * @param {Boolean} disableHeadJs Not to use head.js
   * @return {String}
   */
  getJsTags: function getJsTags(group, disableHeadJs) {
    return getScriptTags.call(this, group, disableHeadJs, 'js');
  },

  /**
   * Get the css script tags use to include css in your html file
   *
   * @param {String|Array} group Name of the script group(s) (e.g. 'user', ['guest', 'user'])
   * @return {String}
   */
  getCssTags: function getCssTags(group) {
    return getScriptTags.call(this, group, true, 'css');
  },

  /**
   * Add a piece of source code to a url (virtual)
   *
   * @param {String} url Relative url of the code
   * @param {String|Function} code Source code
   * @param {String|Array} group Group(s) of this js
   */
  addJsCode: function addJsCode(url, code, group) {
    var script = this.scripts[url] || {url: url};
    script['code'] = script['code'] || '';
    if (typeof code === 'string') {
      script['code'] += code;
    } else {
      script['code'] += '\n(' + code.toString() +')($);\n';
    }
    script['length'] = Buffer.byteLength(script['code']);
    script['hash'] = crypto.md5(script['code']);
    script['group'] = Array.isArray(group) ? group : [group];
    script['type'] = 'js';
    this.scripts[url] = script;
    if (this.scriptIndexes.indexOf(url) === -1) {
      this.scriptIndexes.push(url);
    }
  },

  /**
   * Get source code according to url
   *
   * @param {String} url Url of your script file relative to `staticUrl`
   * @param {Boolean} minify Minify source if `true`
   * @return {String} Source of the script
   */
  getScript: function getScript(url, minify) {
    var script = this.scripts[url];
    if (minify && script.code) {
      if (!script.minifiedLength) {
        script = minifyJs(script);
        this.scripts[url] = script;
      }
      return {
        url: script.url,
        path: script.path,
        code: script.minified,
        length: script.minifiedLength,
        hash: script.hash,
        group: script.group,
        type: script.type
      };
    }
    return script;
  }
};

// private functions

function addScript(url, group, path, type) {
  if (this.scriptIndexes.indexOf(url) > -1) {
    throw new Error('Duplicated script url: ' + url);
  }
  var script = {
    url: url,
    group: Array.isArray(group) ? group : [group],
    path: path ? path : url,
    type: type
  };
  this.scripts[url] = script;
  this.scriptIndexes.push(url);

  var self = this;
  if (type === 'js') {
    fs.readFile(Path.join(this.staticRoot, script.path), 'utf8', function(err, code) {
      if (err) throw err;
      script.code = code;
      script.length = Buffer.byteLength(code);
      script.hash = crypto.md5(code, 'hex');
      script = minifyJs(script);
      self.scripts[url] = script;
    });
  } else {
    crypto.md5file(Path.join(this.staticRoot, script.path), 'hex', function(err, hexHash) {
      if (err) throw err;
      script.hash = hexHash;
      self.scripts[url] = script;
    });
  }
}

function genScriptTag(url, type) {
  switch (type) {
    case 'js':
      return '<script src="' + url + '" type="text/javascript"></script>';
    case 'css':
      return '<link rel="stylesheet" type="text/css" href="' + url + '" />';
    default:
      return '';
  }
}

function getScriptTags(group, disableHeadJs, type) {
  var self = this;
  var scripts = this.scriptIndexes.filter(function(scriptUrl) {
    var script = self.scripts[scriptUrl];
    if (script.type === type) {
      if (Array.isArray(group)) {
        for (var i = 0, len = group.length; i < len; i++) {
          if (script.group.indexOf(group[i]) > -1) {
            return true;
          }
        }
      } else {
        return script.group.indexOf(group) > -1;
      }
    }
  }, this);

  function makeUrl(url) {
    var script = self.scripts[url];
    return self.staticUrl + url + (script.hash ? '?' + script.hash : '');
  }

  if (disableHeadJs) {
    return scripts.map(
      function(scriptUrl) {
        return genScriptTag(makeUrl(scriptUrl), type);
      }).join('\n');
  } else if (type === 'js') {
    var headjsTag = '<script src="'+this.staticUrl+'/js/head.min.js" type="text/javascript"></script>\n';
    return headjsTag + '<script type="text/javascript">head.js(' + scripts.map(
      function(scriptUrl) {
        return '"' + makeUrl(scriptUrl) + '"';
      }).join(',') + ');</script>\n';
  }
  return '';
}

function uglifyJs(code) {
  var ast = jsp.parse(code); // parse code and get the initial AST
  ast = pro.ast_mangle(ast); // get a new AST with mangled names
  ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
  return pro.gen_code(ast); // compressed code here
}

function minifyJs(script) {
  script.minified = '\n' + uglifyJs(script.code);
  script.minifiedLength = Buffer.byteLength(script.minified);
  script.contentType = 'application/javascript';
  return script;
}

exports.Script = Script;