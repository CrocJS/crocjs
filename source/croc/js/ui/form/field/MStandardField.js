/**
 * Реализация стандартных методов поля формы {@see croc.ui.form.field.IField}
 */
croc.Mixin.define('croc.ui.form.field.MStandardField', {
    include: croc.ui.form.validation.MStandardValidatable,
    
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
