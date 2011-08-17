// views
var app = np.genji.app();

var routes = [
  ['.*', function() {
    // default 404 handler
    this.error(404, '`' + this.request.url + '` not found');
  }, 'notfound']
];

app.mount(routes);

// This the clientside bootstrip script that all apps depend on.
function mainInitJs($) {
  // global nodepress object
  var np = $.np = {};
  var event = np._event = $({});
  // the messaging hub
  np.$ = $; // jQuery need this to work
  np.emit = function(eventType, extraParameters) {
    event.trigger(eventType, extraParameters);
  }
  np.on = function() {
    event.bind.apply(event, arguments);
  }
  // cache all the dom object here
  np.dom = {};
  // growl like notification widget (jquery-gritter)
  np.growl = $.gritter.add;
  // Rest api
  np.api = {};
  // params for querying aginst remote apis
  np.params = {};

  // handle ajax error
  np.on('#AjaxError', function(event, title, xhr, status) {
    $.np.growl({
      title: title,
      sticky: true,
      text: xhr.responseText
    });
  });
}

// add scripts
// js
[
  {relativePath: "js/jquery-1.4.2.js", group: "main"},
  {relativePath: "js/jquery.gritter-1.7.js", group: "main"},
  {relativePath: "js/jquery.tools.tabs-1.2.5.js", group: "main"},
  {relativePath: "js/mustache-0.3.0.js", group: "main"},
  {relativePath: "js/showdown-0.9.js", group: "main"}
].forEach(function(js) {
  np.script.addJs(js.relativePath, js.group);
});

// css
[
//    {type: "css", basename: "screen.css", group: "main"},
  {relativePath: "css/style.css", group: "main"},
  {relativePath: "css/jquery.gritter.css", group: "main"},
  {relativePath: "css/tabs.css", group: "user"}
].forEach(function(css) {
  np.script.addCss(css.relativePath, css.group);
});

np.script.addJsCode('js/main.js', mainInitJs, 'main');