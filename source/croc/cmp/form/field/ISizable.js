/**
 * Поле, которое имеет размеры (стандартно от 1 до 5)
 */
croc.Interface.define('croc.cmp.form.field.ISizable', {
    extend: croc.cmp.form.field.IField,
    
    members: {
        /**
         * Field size
         * @returns {string}
         */
        getSize: function() {}
    }
});
