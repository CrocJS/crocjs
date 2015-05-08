croc.Mixin.define('croc.ui.form.field.MStandardDisable', {
    properties: {
        /**
         * Блокировка поля
         * @type {boolean}
         */
        disabled: {
            cssClass: 'state_disabled',
            type: 'boolean',
            apply: '_applyDisabled',
            option: true
        }
    },
    
    preConstruct: function() {
        this.on('changeRendered', function() {
            if (this.getDisabled()) {
                this._applyDisabled(this.getDisabled());
            }
        }, this);
    },
    
    members: {
        /**
         * Применить заблокированное состояние поля
         * @param {boolean} value
         * @protected
         */
        _applyDisabled: function(value) {
        }
    }
});