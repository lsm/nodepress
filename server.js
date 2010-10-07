var settings = require("./settings");
global.genji = require('genji');
genji.settings = settings;

// start server
var server = genji.web.startServer(settings);
module.exports = server;