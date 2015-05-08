/**
 * Поле, которое имеет размеры (стандартно от 1 до 5)
 */
croc.Interface.define('croc.ui.form.field.ISizable', {
    extend: croc.ui.form.field.IField,
    
    members: {
        /**
         * Размер поля
         * @returns {string}
         */
        getSize: function() {}
    }
});
