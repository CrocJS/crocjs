croc.define('croc.View', {
    /**
     * @param {string} name
     * @param {Object} description
     * @returns {Function}
     */
    define: function(name, description) {
        var widgetCls = croc.Class.getClass(name.split('.').slice(0, -1).join('.'));
        description.extend = croc.cmp.Widget.getView(widgetCls.baseclass);
        return croc.Class.define(name, description);
    }
});