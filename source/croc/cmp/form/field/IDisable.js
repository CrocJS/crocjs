/**
 * Поле, которому можно менять доступность (disable, enable)
 */
croc.Interface.define('croc.cmp.form.field.IDisable', {
    extend: croc.cmp.form.field.IField,
    
    members: {
        /**
         * Является ли поле недоступным
         * @returns {boolean}
         */
        getDisabled: function() {},
        
        /**
         * Изменить недоступность поля
         * @param {boolean} value
         */
        setDisabled: function(value) {}
    }
});
