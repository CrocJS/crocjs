/**
 * Реализация интерфейса {@link croc.ui.form.field.ISizable} для потомков класса {@link croc.ui.form.field.AbstractFieldWrapper}
 */
croc.Mixin.define('croc.ui.form.field.MSizableFieldWrapper', {
    options: {
        /**
         * Является ли поле недоступным
         * @type {string}
         */
        size: {
            type: 'string'
        }
    },
    
    construct: function(options) {
        this._addExtendingWrapperOptions('size');
    },
    
    members: {
        /**
         * Размер поля
         * @returns {string}
         */
        getSize: function() {
            return this._getWrappedField() ?
                this._getWrappedField().getSize.apply(this._getWrappedField(), arguments) :
                this._options.size;
        }
    }
});
