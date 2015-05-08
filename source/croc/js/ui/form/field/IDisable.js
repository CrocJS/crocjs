/**
 * Поле, которому можно менять доступность (disable, enable)
 */
croc.Interface.define('croc.ui.form.field.IDisable', {
    extend: croc.ui.form.field.IField,
    
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
