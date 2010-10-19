var view = np.view;

function helloworld() {
    this.sendHTML('Hello world\n');
}

function notFound() {
    var self = this;
    view.render('404.html', {url: this.request.url}, function(html) {
        self.error(404, html);
    });
}

exports.view = [
    ['^/hello/$', helloworld, 'get'],
    ['.*', notFound, 'notfound']
];