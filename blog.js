var nun = require("./lib/nun"),
path = require('path');

//Mu.templateExtension = 'html';

function index(handler) {

    nun.render(path.join(__dirname, '/views/index.html'), {staticUrl: genji.settings.staticUrl}, {}, function (err, output) {
        if (err) {
            throw err;
        }

        var buffer = '';

        output.addListener('data', function (c) {
            buffer += c;
        })
        .addListener('end', function () {
            //sys.puts(buffer);
            handler.send(buffer);
        });
    });
    //handler.staticFile('./views/index');
}

function hello_world(handler) {
    handler.send('Hello world!');
}

module.exports = [
    ['^/$', index],
    ['^/hello/$', hello_world]
];