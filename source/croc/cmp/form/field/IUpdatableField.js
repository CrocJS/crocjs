/**
 * Поле содержащее событие update
 */
croc.Interface.define('croc.cmp.form.field.IUpdatableField', {
    extend: croc.cmp.form.field.IField,
    
    properties: {
        /**
         * Мгновенное значение поля
         * @type {*}
         */
        instantValue: {
            getter: null,
            event: true
        }
    }
});