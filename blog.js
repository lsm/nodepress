
function hello_world(handler) {
    handler.send('Hello world!');
}

module.exports = [
    ['^/hello/$', hello_world]
];