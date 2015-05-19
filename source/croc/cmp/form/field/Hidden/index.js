/**
 * Hidden text field
 */
croc.Class.define('croc.cmp.form.field.Hidden', {
    extend: croc.cmp.Widget,
    
    properties: {
        /**
         * Is field disabled
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
        },
        
        /**
         * @type {string}
         */
        value: {
            model: true
        }
    },
    
    members: {
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.Hidden.superclass._initModel.apply(this, arguments);
            var fieldId = this.getValueByAlias('#fieldId');
            if (fieldId) {
                this._options.elid = fieldId;
            }
        }
    }
});
