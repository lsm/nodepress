var Path = require('path');
var fs = require('fs');
var crypto = require('genji').require('crypto');


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
  this.groups = {};
  this.cssScripts = {};
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
   * Add a piece of source code to a url
   *
   * @param {String} url Relative url of the code
   * @param {String|Function} code Source code
   */
  addJsCode: function addJsCode(url, code) {
  },

  /**
   * Get source code according to url
   *
   * @param {String} url Url of your script file relative to `staticUrl`
   * @param {Boolean} minify Minify source if `true`
   * @return {String} Source of the script
   */
  getJsCode: function getJsCode(url, minify) {

  },

  /**
   * Get script meta by url
   *
   * @param {String} url Url of your script file relative to `staticUrl`
   * @return {Object} Object with following format:
   * <code>
   *     {
   *         hash: '6626c831d24487114195050769e4691b', // md5 hash of the script content before minified
   *         length: 1250, // length of the content before minified
   *         lengthMinified: 368, // length of the content after minified
   *     }
   * </code>
   */
  getMeta: function getMeta(url) {

  }
};

// private functions

function addScript(url, group, path, type) {
  if (this.staticUrl.slice(-1) === '/' && url.slice(0, 1) === '/') {
    url = url.slice(1);
  }
  var script = {
    url: url,
    group: Array.isArray(group) ? group : [group],
    path: path ? path : url,
    type: type
  };
  this.scripts[url] = script;
  if (this.scriptIndexes.indexOf(url) > -1) {
    throw new Error('Duplicated script url: ' + url);
  }
  this.scriptIndexes.push(url);

  var self = this;
  crypto.md5file(Path.join(this.staticRoot, script.path), 'hex', function(err, hexHash) {
    if (err) throw err;
    script['hash'] = hexHash;
    self.scripts[url] = script;
  });
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
    return 'head.js(' + scripts.map(
      function(scriptUrl) {
        return '"' + makeUrl(scriptUrl) + '"';
      }).join(',') + ');\n';
  }
  return '';
}

exports.Script = Script;