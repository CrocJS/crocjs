/**
 * api-ru Поле, которому можно менять доступность (disable, enable)
 * api-en Field, which can be changed availability (disable, enable).
 */
croc.Interface.define('croc.cmp.form.field.IDisable', {
    extend: croc.cmp.form.field.IField,
    
    members: {
        /**
         * api-ru Является ли поле недоступным
         * api-en Is field disabled?
         * @returns {boolean}
         */
        getDisabled: function() {},
        
        /**
         * api-ru Изменить недоступность поля
         * api-en Set field as disabled.
         * @param {boolean} value
         */
        setDisabled: function(value) {}
    }
});
