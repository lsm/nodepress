#!/usr/bin/env node

// this file is modified base on ExpressJs (express/bin/express.js)


/**
 * Module dependencies.
 */

var sys = require('sys'),
childProcess = require('child_process'),
Path = require('path'),
fs = require('fs'),
nomnom = require('../lib/nomnom'),
exec = childProcess.exec,
spawn = childProcess.spawn;

/**
 * Framework version.
 */

var version = '0.1.7';

/**
 * stdin stream.
 */

var stdin;

/**
 * Option definitions for nomnomargs
 */
var opts = [
    {name: 'bind'
    ,string: '-b HOSTNAME:PORT'
    ,'long': '--bind=HOSTNAME:PORT'
    ,help: 'Server hostname and listening port, can override the values defined in your setting file'},
    {name: 'path'
    ,string: '-p EXEC_PATH'
    ,'long': '--path=EXEC_PATH'
    ,'default': process.cwd()
    ,help: 'Execution path of nodepress, default `.`'},
    {name: 'command'
    ,position: 0},
    {name: 'target'
    ,position: 1}
];

// parse options
var options = nomnom.parseArgs(opts, {script: 'nodepress'}), host, port;
if (options.bind) {
    var bind = options.bind.split(':');
    host = bind[0];
    port = bind[1];
}
if (options.path) {
    require.paths.push(options.path);
}

// run command
switch(options.command) {
    case 'init':
        init(options.path);
        break;
    case 'start':
        start(options.target);
        break;
    case 'dev':
        dev(options.target);
        break;
    default:
        throw new Error('Unknow command: ' + options.command);
}

/**
 * Types of project mapping to creating functions
 */
var projectTypes = ['helloworld', 'framework', 'blog'];

/**
 * Skeleton path
 */
var skeletonPath = Path.join(__dirname, '../skeletons');


/**
 * Initialize a new project
 *
 * @param {String} path
 * @param {Boolean} force Init the project even if the directory is not empty
 */
function init(path, force) {
    fs.readdir(path, function(err, files) {
        if (err && err.errno !== process.ENOENT) throw err;
        if (!files || !files.length || force) {
            // directory is empty
            if (projectTypes.indexOf(options.target) > -1) {
                // create the project by copying all files under corresponding skeleton dir
                copy(Path.join(skeletonPath, options.target, '/*'), path);
            } else {
                abort('Project type not exists.');
            }
        } else {
            // prompt a confirmation
            confirm('The directory is not empty, are you sure you want to continue?', function(yes) {
                yes && init(path, true);
            });
        }
    });
}

/**
 * Copy
 *
 * @param {String} src Source directory
 * @param {String} dest Destination directory
 */
function copy(src, dest) {
    exec('cp -rfv ' + src + ' ' + dest, function(error, stdout, stderr) {
        console.log(stderr);
        if (error !== null) {
            console.log(error);
            abort('Failed to create project');
        } else {
            console.log('Your project had been created.');
            process.exit(0);
        }
    });
}

/**
 * Load the boot file and try to start a server
 */
function start(bootFile) {
    var np = require('../index');
    if (bootFile[0] === '.' || bootFile[0] !== '/') {
        bootFile = Path.join(options.path, bootFile);
    }
    process.argv.push('--path='+options.path);
    var settings = require(bootFile);
    settings.host = host || settings.host || '127.0.0.1';
    settings.port = port || settings.port || 8000;
    np.startServer(settings);
}

/**
 * Start the server and restart when file is modified
 */
function dev(bootFile) {
    var args = process.argv;
    args[2] = 'start'; // replace `dev` by `start`
    args[3] = bootFile;
    args.shift(); // remove `node`
    require('../index');
    args.push('--path='+options.path);
    var runScript = require('genji/util/manager').runScript;
    runScript(args, process.cwd());
}

/* Helper functions */

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */

function emptyDirectory(path, fn) {
    fs.readdir(path, function(err, files){
        if (err && err.errno !== process.ENOENT) throw err;
        fn(!files || !files.length);
    });
}

/**
 * Prompt confirmation with the given `msg`.
 *
 * @param {String} msg
 * @param {Function} fn
 */

function confirm(msg, fn) {
    prompt(msg, function(val){
        fn(/^ *y(es)?/i.test(val));
    });
}

/**
 * Prompt input with the given `msg` and callback `fn`.
 *
 * @param {String} msg
 * @param {Function} fn
 */

function prompt(msg, fn) {
    stdin = stdin || process.openStdin();
    sys[msg[msg.length - 1] == ' ' ? 'print' : 'puts'](msg);
    stdin.setEncoding('ascii');
    stdin.addListener('data', function(data){
        fn(data);
        stdin.removeListener('data', arguments.callee);
    });
}

/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */

function abort(str) {
    sys.error(str);
    process.exit(1);
}