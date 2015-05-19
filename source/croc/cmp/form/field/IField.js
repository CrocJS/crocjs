/**
 * Поле формы
 */
croc.Interface.define('croc.cmp.form.field.IField', {
    extend: [
        croc.cmp.form.validation.IValidatable,
        croc.cmp.IWidget
    ],
    
    properties: {
        /**
         * Значение поля
         */
        value: {
            event: true
        }
    },
    
    members: {
        /**
         * Если возвращает объект, то он примешивается к значениям формы
         * @returns {Object}
         */
        exportValues: function() {},
        
        /**
         * Вызывается перед отправкой формы
         */
        onSubmit: function() {},
        
        /**
         * Изменить значение поля
         * @param {*} value
         */
        setValue: function(value) {}
    }
});
