/**
 * Реализация интерфейса {@link croc.cmp.form.field.ISizable} для потомков класса {@link croc.cmp.form.field.AbstractFieldWrapper}
 */
croc.Mixin.define('croc.cmp.form.field.MSizableFieldWrapper', {
    properties: {
        /**
         * Является ли поле недоступным
         * @type {string}
         */
        size: {
            type: 'string',
            __setter: null,
            model: true
        }
    },
    
    construct: function(options) {
        this._addExtendingWrapperOptions('size');
    }
});
