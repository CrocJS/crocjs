croc.Class.define('croc.cmp.Widget.View', {
    extend: croc.Object,
    
    options: {
        model: {},
        widget: {}
    },
    
    construct: function(options) {
        this._model = options.model;
        this._options = options.model.data;
        this._widget = options.widget;
        croc.cmp.Widget.View.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * get widget dom-element
         * @returns {jQuery}
         */
        getElement: function() {
            return this._widget.getElement();
        },
        
        /**
         * After widget creating
         */
        onCreate: function() {}
    }
});