croc.View.define('croc.cmp.form.Button.View', {
    members: {
        /**
         * After widget creating
         */
        onCreate: function() {
            croc.cmp.form.Button.View.superclass.onCreate.apply(this, arguments);
            this._widget.getElement().on({
                click: function(e) {
                    if (!this._widget.click() || this._model.get('preventDefault')) {
                        e.preventDefault();
                    }
                    if (this._model.get('stopPropagation')) {
                        e.stopPropagation();
                    }
                }.bind(this),
                mousedown: function(e) {
                    if (this._model.get('stopPropagation')) {
                        e.stopPropagation();
                    }
                }.bind(this)
            });
        }
    }
});
