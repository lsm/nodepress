;
(function($) {
    $.np = {};

    $.np.showdown = new Showdown.converter();
    $.np.tpl = {
        posts: '{{#posts}}<div class="np-post"><h2 class="np-post-title">{{title}}</h2>'
    +'<h4 class="np-post-date np-right">{{published}}</h4><div class="np-post-content">{{{content}}}</div>'
    +'<div class="np-post-tags np-right">{{#tags}}<div class="np-post-tag">{{name}}</div>{{/tags}}</div></div>{{/posts}}'
    };
    $.np.api = (function(prefix) {
        return {
            save: prefix + 'save/',
            list: prefix + 'list/'
        }
    })('/_api/');
    $.np.init = function() {

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

    $.np.getList = function getList(skip, limit, tags) {
        var url = $.np.api.list + skip + '/' + limit + '/';
        if (tags.length > 0) {
            url += tags.join(',') + '/';
        }
        $.getJSON(url, function(json) {
            var tpl = $.np.tpl.posts;
            if (json) {
                var views = {
                    posts: $.each(json, function(idx, view) {
                        if (view.content) view.content = $.np.showdown.makeHtml(view.content);
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
                var post = Mustache.to_html(tpl, views);
                $('#np-posts').attr('innerHTML', post);
                // bind event to tags
                $('.np-post-tag').click(function(event) {
                    if (tags.indexOf(event.currentTarget.innerHTML) < 0) {
                        tags.push(event.currentTarget.innerHTML);
                        $.np.tagSelected = tags;
                    }
                    getList(skip, limit, tags);
                });
            } // @todo popup error
        });
    }

    var postId;
    $.np.onSave = function(event, np, publish, callback) {
        var post = {};
        post.title = np.title.attr('value');
        post.tags = [];
        $.each(np.tags.attr('value').split(','), function(idx, tag) {
            if (tag) post.tags.push($.trim(tag));
        });
        post.content = np.input.attr('value');
        if (postId) post._id = postId;
        if (publish) post.published = 1;
        $.post($.np.api.save,
            JSON.stringify(post),
            function(id) {
                postId = id;
                var growlTitle = publish ? 'Published successfully' : 'Saved successfully';
//                $.gritter.add({
//                    // (string | mandatory) the heading of the notification
//                    title: growlTitle,
//                    // (string | mandatory) the text inside the notification
//                    text: ' '
//                });
                callback && callback(np);
            });
    }

    $.np.resetEditor = function (np) {
        hideEditor(np);
        $.each([np.title, np.tags, np.input], function(idx, item) {
            item.attr('value', '');
        });
        np.previewDiv.attr('innerHTML', '');
        postId = null;
    }

    function hideEditor(np) {
        np.tabs.click(0);
    }

})(jQuery);
