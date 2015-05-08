croc.Class.define('croc.cmp.Widget.View', {
    extend: croc.Object,

    options: {
        model: {},
        widget: {}
    },

    construct: function(options) {
        this._model = options.model;
        this._widget = options.widget;
        croc.cmp.Widget.View.superclass.__construct__.apply(this, arguments);
    },

    members: {
        /**
         * After widget creating
         */
        onCreate: function() {}
    }
});