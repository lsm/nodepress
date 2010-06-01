# mustache.js

> What could be more logical awesome than no logic at all?

Shamless port of http://github.com/defunkt/mustache
by Jan Lehnardt <jan@apache.org>.

Thanks @defunkt for the awesome code.

For a list of implementations (other than JavaScript) and editor
plugins, see <http://defunkt.github.com/mustache/>.


## Where to Use?

You can use mustache.js rendering stuff in various scenarios. E.g. you can render
templates in your browser, or rendering server-side stuff with [node.js][node.js],
use it for rendering stuff in [CouchDB][couchdb]'s views.


## Who Uses Mustache?

An updated list is kept on the Github wiki. Add yourself, if you use
mustache.js:
<http://wiki.github.com/janl/mustache.js/beard-competition>


## Usage

A quick example how to use mustache.js:

    var view = {
      title: "Joe",
      calc: function() {
        return 2 + 4;
      }
    }

    var template = "{{title}} spends {{calc}}";

    var html = Mustache.to_html(template, view);

`template` is a simple string with mustache tags and `view` is a JavaScript object containing the.


## Template Tag Types

There are several types of tags currently implemented in mustache.js.

For a language-agnostic overview of Mustache's template syntax, see
the `mustache(5)` manpage or
<http://defunkt.github.com/mustache/mustache.5.html>.

### Simple Tags

Tags are always surrounded by mustaches like this `{{foobar}}`.

    var view = {name: "Joe", say_hello: function(){ return "hello" }}

    template = "{{say_hello}}, {{name}}"


### Conditional Sections

Conditional sections begin with `{{#condition}}` and end with `{{/condition}}`. When
`condition` evaluates to true, the section is rendered, otherwise the hole block will
output nothing at all. `condition` may be a function returning true/false or a simple
boolean.

    var view = {condition: function() {
      // [...your code goes here...]
      return true;
    }}

    {{#condition}}
      I will be visible if condition is true
    {{/condition}}


### Enumerable Sections

Enumerable Sections use the same syntax as condition sections do.
`{{#shopping_items}}` and `{{/shopping_items}}`. Actually the view decides how
mustache.js renders the section. If the view returns an array, it will iterator over
the items. Use `{{.}}` to access the current item inside the enumeration section.

    var view = {name: "Joe's shopping card",
                items: ["bananas", "apples"]}

    var template = "{{name}}: <ul> {{#items}}<li>{{.}}</li>{{/items}} </ul>"

    Outputs:
    Joe's shopping card: <ul><li>bananas</li><li>apples</li></ul>


### View Partials

mustache.js supports a quite powerful but yet simple view partial mechanism. Use the
following syntax for partials: `{{>partial_name}}`

    var view = {
      name: "Joe",
      winnings: {
        value: 1000,
        taxed_value: function() {
            return this.value - (this.value * 0.4);
        }
      }
    };

    var template = "Welcome, {{name}}! {{>winnings}}"
    var partials = {
      winnings: "You just won ${{value}} (which is ${{taxed_value}} after tax)"};

    var output = Mustache.to_html(template, view, partials)

    output will be:
    Welcome, Joe! You just won $1000 (which is $600 after tax)

You invoke a partial with `{{>winnings}}`. Invoking the partial `winnings` will tell
mustache.js to look for a object in the context's property `winnings`. It will then
use that object as the context for the template found in `partials` for `winnings`.


## Escaping

mustache.js does escape all values when using the standard double mustache syntax.
Characters which will be escaped: `& \ " < >`. To disable escaping, simply use
tripple mustaches like `{{{unescaped_variable}}}`.

Example: Using `{{variable}}` inside a template for `5 > 2` will result in `5 &gt; 2`, where as the usage of `{{{variable}}}` will result in `5 > 2`.


## Streaming

To stream template results out of mustache.js, you can pass an optional `send()`
callback to the `to_html()` call:

    Mustache.to_html(template, view, partials, function(line) {
      print(line);
    });


## Pragmas

Pragma tags let you alter the behaviour of mustache.js. They have the format of

    {{%PRAGMANAME}}

and they accept options:

    {{%PRAGMANAME option=value}}


### IMPLICIT-ITERATOR

When using a block to iterate over an enumerable (Array), mustache.js expects an
objects as enumerable items. The implicit iterator pragma enables optional behaviour
of allowing literals as enumerable items. Consider this view:

    var view = {
      foo: [1, 2, 3, 4, 5, "french"]
    };

The following template can iterate over the member `foo`:

    {{%IMPLICIT-ITERATOR}}
    {{#foo}}
      {{.}}
    {{/foo}}

If you don't like the dot in there, the pragma accepts an option to set your own
iteration marker:

    {{%IMPLICIT-ITERATOR iterator=bob}}
    {{#foo}}
      {{bob}}
    {{/foo}}


## More Examples and Documentation

See `examples/` for more goodies and read the [original mustache docs][m]

## Command Line

See `mustache(1)` man page or
<http://defunkt.github.com/mustache/mustache.1.html>
for command line docs.

Or just install it as a RubyGem:

    $ gem install mustache
    $ mustache -h

[m]: http://github.com/defunkt/mustache/#readme
[node.js]: http://nodejs.org
[couchdb]: http://couchdb.apache.org
