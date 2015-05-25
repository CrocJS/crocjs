/**
 * Реализация стандартных методов поля формы {@see croc.cmp.form.field.IField}
 */
croc.Mixin.define('croc.cmp.form.field.MStandardField', {
    extend: croc.cmp.form.validation.MStandardValidatable,
    
    events: {
        /**
         * @param value
         * @param old
         */
        changeValue: null
    },
    
    options: {
        /**
         * значение поля
         * @type {*}
         */
        value: null
    },
    
    members: {
        /**
         * Если возвращает объект, то он примешивается к значениям формы
         * @returns {Object}
         */
        exportValues: function() {
            return null;
        },
        
        /**
         * Вызывается перед отправкой формы
         */
        onSubmit: function() {}
    }
});
