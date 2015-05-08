/**
 * Реализация интерфейса {@link croc.ui.form.field.IDisable} для потомков класса {@link croc.ui.form.field.AbstractFieldWrapper}
 */
croc.Mixin.define('croc.ui.form.field.MDisableFieldWrapper', {
    options: {
        /**
         * Является ли поле недоступным
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            value: false
        }
    },
    
    construct: function(options) {
        this._addExtendingWrapperOptions('disabled');
    },
    
    members: {
        /**
         * Является ли поле недоступным
         * @returns {boolean}
         */
        getDisabled: function() {
            return this._getWrappedField() ?
                this._getWrappedField().getDisabled.apply(this._getWrappedField(), arguments) :
                this._options.disabled;
        },
        
        /**
         * Изменить недоступность поля
         * @param {boolean} value
         */
        setDisabled: function(value) {
            if (this._getWrappedField()) {
                this._getWrappedField().setDisabled.apply(this._getWrappedField(), arguments);
            }
            this._options.disabled = value;
        }
    }
});
