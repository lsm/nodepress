var settings = require("./settings");
global.genji = require('genji');
genji.settings = settings;
// start server
genji.web.startServer(settings);