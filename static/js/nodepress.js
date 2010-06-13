;
(function($) {
    // setup
    $.np = {};
    var emitter = $.np.emitter = $({});
    var showdown = $.np.showdown = new Showdown.converter();
    var tpl = $.np.tpl = {
        posts: '{{#posts}}<div class="np-post"><h2 class="np-post-title">{{title}}</h2>'
    +'<h4 class="np-post-date np-right">{{published}}</h4><div class="np-post-content">{{{content}}}</div>'
    +'<div class="np-post-tags np-right">{{#tags}}<div class="np-post-tag">{{name}}</div>{{/tags}}</div></div>{{/posts}}'
    };
    var growl = $.gritter.add;
    
    var postId;
    var np;

    $.np.init = function() {
        np = $.np.dom;
    }

    // rest apis and remote calls
    var api = {
        list: function(skip, limit, tags) {
            var url = '/_api/list/' + skip + '/' + limit + '/';
            if (tags.length > 0) {
                url += encodeURIComponent(tags.join(',')) + '/';
            }
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json',
                success: function(data, status) {
                    emitter.trigger('@ApiList', [data, {
                        skip: skip,
                        limit: limit,
                        tags: tags
                    }]);
                },
                error: function(xhr, status) {
                    emitter.trigger('#ApiList', [xhr, status]);
                }
            });
        },
        save: function(publish) {
            var post = {};
            post.title = np.title.attr('value');
            post.tags = [];
            $.each(np.tags.attr('value').split(','), function(idx, tag) {
                if (tag) post.tags.push($.trim(tag));
            });
            post.content = np.input.attr('value');
            if (postId) post._id = postId;
            if (publish) post.published = 1;

            $.ajax({
                url: '/_api/save/',
                data: post,
                dataType: 'text',
                success: function(id) {
                    emitter.trigger('@ApiSave', [id, publish]);
                },
                error: function(xhr, status) {
                    emitter.trigger('#ApiSave', [xhr, status]);
                }
            });
        }
    };
    $.np.api = api;
    
    $.np.signIn = function() {
        $.ajax({
            url: '/signin/',
            type: 'POST',
            dataType: 'text',
            data: {
                username: np.username.attr('value'),
                password: np.password.attr('value')
            },
            success: function(data) {
                emitter.trigger('@Login', [data]);
            },
            error: function(xhr, status) {
                emitter.trigger('#Login', [xhr, status]);
            }
        });
    }

    // events
    emitter.bind('@Login', function(event, data) {
        location.href = '/';
    });
    emitter.bind('#Login', function(event, xhr, status) {
        $.gritter.add({
            title: "Failed to sign in",
            time: 3000,
            text: xhr.responseText
        });
    });

    emitter.bind('@ApiList', function(event, data, params) {
        var tpl = $.np.tpl.posts;
        var views = {
            posts: $.each(data, function(idx, view) {
                if (view.content) {
                    view.content = $.np.showdown.makeHtml(view.content);
                }
                view.published = new Date(parseInt(view.published)).toLocaleDateString();
                if (view.hasOwnProperty("tags")) {
                    $.each(view.tags, function(idx, tag) {
                        view.tags[idx] = {
                            name: tag
                        };
                    });
                }
            })
        };
        //emitter.trigger('PostContentBeforeMU', [tpl, views]); // event <=> hook ?
        var post = Mustache.to_html(tpl, views);
        //emitter.trigger('PostContentAfterMU', [tpl, views]);
        $('#np-posts').attr('innerHTML', post);
        // bind event to tags
        $('.np-post-tag').click(function(event) {
            if (params.tags.indexOf(event.currentTarget.innerHTML) < 0) {
                $.merge(params.tags, [event.currentTarget.innerHTML]);
                emitter.trigger('TagSelected', [params]);
            }
        });
    });

    emitter.bind('@ApiSave', function(event, id, publish) {
        postId = id;
        growl({title: publish ? 'Published successfully' : 'Saved successfully', text: ' '});
        publish && $.np.resetEditor();
    });

    emitter.bind('TagSelected', buildTagsFilter);

    function buildTagsFilter(event, params) {
        api.list(params.skip, params.limit, params.tags);
        np.filter.attr('innerHTML', '');
        $.each(params.tags, function(idx, tag) {
            np.filter.prepend('<div class="np-filter-tag">'+ tag +'</div>');
        });
        $('#np-filter div').click(function(event) {
            var tag = event.currentTarget.innerHTML;
            params.tags = $.grep(params.tags, function(t) {
                return tag != t;
            });
            buildTagsFilter(event, params);
            api.list(params.skip, params.limit, params.tags);
        });
    }

    var lastContent;
    /**
     * convert markdown and show the converted in preview div
     *
     * @param {Object} input Input element (jQuery)
     * @param {Object} preview Preview element (jQuery)
     * @param {Object} showdown Instance of showdown
     */
    $.np.preview = function(input, preview) {
        var content = input.attr('value');
        content = content === lastContent ? false : content;
        if (content !== false) {
            lastContent = content;
            preview.attr('innerHTML', $.np.showdown.makeHtml(content));
        }
    }

    $.np.resetEditor = function() {
        np.tabs.click(0);
        $.each([np.title, np.tags, np.input], function(idx, item) {
            item.attr('value', '');
        });
        np.previewDiv.attr('innerHTML', '');
        postId = null;
    }

})(jQuery);
