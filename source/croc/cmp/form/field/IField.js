/**
 * api-ru Поле формы
 * api-en Field form.
 */
croc.Interface.define('croc.cmp.form.field.IField', {
    extend: [
        croc.cmp.form.validation.IValidatable,
        croc.cmp.IWidget
    ],
    
    properties: {
        /**
         * api-ru Значение поля
         * api-en Field value.
         */
        value: {
            event: true
        }
    },
    
    members: {
        /**
         * api-ru Если возвращает объект, то он примешивается к значениям формы
         * api-en If returns the object, then it exports to form values.
         * @returns {Object}
         */
        exportValues: function() {},
        
        /**
         * api-ru Вызывается перед отправкой формы
         * api-en Called before submitting the form.
         */
        onSubmit: function() {},
        
        /**
         * api-ru Изменить значение поля
         * api-en Change field value.
         * @param {*} value
         */
        setValue: function(value) {}
    }
});
