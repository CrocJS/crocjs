/**
 * api-ru Реализация стандартных методов поля формы {@see croc.cmp.form.field.IField}
 * api-en Implementation of standard methods of form field.
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
         * api-ru значение поля
         * api-en Field value.
         * @type {*}
         */
        value: {}
    },
    
    members: {
        /**
         * api-ru Если возвращает объект, то он примешивается к значениям формы
         * api-en If returns the object, then it exports to form values.
         * @returns {Object}
         */
        exportValues: function() {
            return null;
        },
        
        /**
         * api-ru Вызывается перед отправкой формы
         * api-en Called beffore submitting the form.
         */
        onSubmit: function() {}
    }
});
