0.1.5 (?)
- account: password recovery, change password, user registration
- use form for login
- add author info for post
- cache combined/compressed file, it's slow

0.1.4 (2010/08/27)
- theme system
    * inject script tag by system facilities
    * combine static files by type (css/js) and group
    * allow replacing mustache templates (specific or all)
- handle error at client side for unexpected server response
- $.np now can act as event emitter
- cleanup usage of $.np, np and dom

0.1.3 (2010/08/25)
---------
- tags cloud
- compress js code using [UglifyJS](http://github.com/mishoo/UglifyJS)

0.1.2 (2010/07/23):
-------------------
- core.index as bootscript
- handle static files
- generate clientside code from server side with order control
- customize site title and intro
- separate template file into pieces (using partial)
- use url to connect mongodb

0.1.0 - 0.1.1 (2010/07/01):
-------------------
- MongoDb pooling
- class for db and collection
- introduce [promise](http://github.com/kriszyp/node-promise) written by [Kris Zyp](http://www.sitepen.com/blog/author/kzyp/)
- new code structure that easy to extend

0.0.2 - 0.0.3 (2010/06/23):
-------------------
- Cookie based authentication
- Edit post
- Paginator
- Allow insert code at footer to track your visits

0.0.1 (2010/06/11):
-------------------
- save/update post
- basic tag support
- use Mustache as template engine for both client and server side
- use showdown to render blog post (markdown)
- store data in mongodb