
0.3.1 (2011/08/?)
- compress css by [sqwish](https://github.com/ded/sqwish)
- ender.js

0.3.0 (2011/08/?)
---------
- `genji` upgrade to `0.2.1`
- replace `core/db.js` by `mongodb-async`
- rewrite and replace `core/client.js` with `core/script.js`
- remove `bin/`, use `nodemon` if you need similar functionalities


0.1.8 (2011/1/31)
---------
- project:    
    - bin/nodepress support watch/reload server for development
- core:
    - rewrite `auth` base on the new cookie middleware of `genji`
    - db: 
        - new methods: `freeDb`, `findEach`, `update`, `ensureIndex`, `distinct`
        - GridFS: `exists`, `copyFromFile`
        - support no-pooling
    - promise: replaced by a simple one
- handler:
    - upload handler (deps: formidable)

0.1.7 (2010/10/19)
------------------
- project:
    - re-organized the structure (can be used as a standalone node module)
    - package.json for npm
    - bin/nodepress.js helper script (creating project skeletons, start server)
    - project skeletons for `blog`, `framework` and simple helloworld example
    - add [nomnomargs](http://github.com/harthur/nomnomargs) for parsing options (lib/nomnomargs)
- core:
    - unify `posts` block template in a file for both server and client side
- app:
    - blog:
        - bug fix: content is not rendered by mustache on article page

0.1.6 (2010/09/14)
------------------
- project:
    - node-markdown as a submodule
- app:
    - blog: 
        - add author info for post
        - default 20 (too many?) posts, remove `post per page`
        - render markdown on server side for first page load
        - post id hash improvement
- core:
    - customizable app path
- theming system:
    - allow setting the template root
- bug fix:
    - fix tabs

0.1.5 (2010/09/07)
------------------
- core:
    - cache combined/compressed file, it's slow
    - update for new middleware and routing system of genji
- app:
    - blog: separate into different files, and put in a directory just like a sub-package

0.1.4 (2010/08/27)
------------------
- theme system
    * inject script tag by system facilities
    * combine static files by type (css/js) and group
- handle error at client side for unexpected server response
- $.np now can act as event emitter
- cleanup usage of $.np, np and dom

0.1.3 (2010/08/25)
------------------
- tags cloud
- compress js code using [UglifyJS](http://github.com/mishoo/UglifyJS)

0.1.2 (2010/07/23)
------------------
- core.index as bootscript
- handle static files
- generate clientside code from server side with order control
- customize site title and intro
- separate template file into pieces (using partial)
- use url to connect mongodb

0.1.0 - 0.1.1 (2010/07/01)
--------------------------
- MongoDb pooling
- class for db and collection
- introduce [promise](http://github.com/kriszyp/node-promise) written by [Kris Zyp](http://www.sitepen.com/blog/author/kzyp/)
- new code structure that easy to extend

0.0.2 - 0.0.3 (2010/06/23)
--------------------------
- Cookie based authentication
- Edit post
- Paginator
- Allow insert code at footer to track your visits

0.0.1 (2010/06/11)
------------------
- save/update post
- basic tag support
- use Mustache as template engine for both client and server side
- use showdown to render blog post (markdown)
- store data in mongodb