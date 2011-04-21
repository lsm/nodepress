


/**
 * Add a javascript file
 * 
 * @param {String} url Url of your js file relative to `staticUrl`
 * @param {String|Array} group Group(s) of this js
 * @param {String} path Path of the js file relative to `staticRoot`,
 * the script will be considered as a virtual script if you ignore this argument.
 */
function addJs(url, group, path) {
    
}

/**
 * Add a css file
 * 
 * @param url
 * @param group
 * @param path
 */
function addCss(url, group, path) {
    
}

/**
 * Get the js script tags use to include javascript in your html file
 * this is handled by head.js by default
 * 
 * @param {String|Array} group Name of the script group(s) (e.g. 'user', 'guest')
 * @param {Boolean} disableHeadJs Not to use head.js
 * @return {String}
 */
function getJsTags(group, disableHeadJs) {
    
}

/**
 * Get the css script tags use to include css in your html file
 * 
 * @param {String|Array} group Name of the script group(s) (e.g. 'user', 'guest')
 * @return {String}
 */
function getCssTags(group) {
    
}

/**
 * Get source code according to url
 * 
 * @param {String} url Url of your script file relative to `staticUrl`
 * @param {Boolean} minify Minify source if `true`
 * @return {String} Source of the script
 */
function getCode(url, minify) {
    
}

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
function getMeta(url) {
    
}

// public api
exports.addJs = addJs;
exports.addCss = addCss;
exports.getJsTags = getJsTags;
exports.getCssTags = getCssTags;
exports.getCode = getCode;
exports.getMeta = getMeta;