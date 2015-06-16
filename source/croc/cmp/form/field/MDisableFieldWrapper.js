/**
 * Реализация интерфейса {@link croc.cmp.form.field.IDisable} для потомков класса {@link croc.cmp.form.field.AbstractFieldWrapper}
 */
croc.Mixin.define('croc.cmp.form.field.MDisableFieldWrapper', {
    properties: {
        /**
         * Является ли поле недоступным
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
        }
    },
    
    construct: function(options) {
        this._addExtendingWrapperOptions('disabled');
    }
});
