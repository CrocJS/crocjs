//+use bower:jquery-mousewheel

var Page = require('derby/lib/Page');

Page.prototype.trim = function(value) {
    return value === undefined || value === null ? '' : String(value).trim();
};
Page.prototype.$bodyClass = function() {
    return 'l-body';
};
Page.prototype.toggle = function(scoped, value) {
    scoped.set(value === undefined ? !scoped.get() : value);
};
Page.prototype.saveEl = function(scoped, el) {
    if (arguments.length === 3) {
        scoped.set(arguments[1], $(arguments[2]));
    }
    else {
        scoped.set($(el));
    }
};
Page.prototype.stopScrolling = function(el) {
    $(el).on('mousewheel', function(e) {
        var delta = e.originalEvent.deltaY;
        if (el.scrollTop >= el.scrollHeight - $(el).height() && delta > 0 ||
            el.scrollTop === 0 && delta < 0) {
            e.preventDefault();
        }
    });
};
Page.prototype.$join = function(glue, arr, index) {
    return index < arr.length - 1 ? glue : '';
};
Page.prototype.$getItem = function(obj, key) {
    return obj[key];
};

Page.prototype.$stop = Page.prototype.$stopPropagation;
Page.prototype.$prevent = Page.prototype.$preventDefault;