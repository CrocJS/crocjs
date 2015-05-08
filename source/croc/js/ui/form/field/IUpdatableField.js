/**
 * Поле содержащее событие update
 */
croc.Interface.define('croc.ui.form.field.IUpdatableField', {
    extend: croc.ui.form.field.IField,
    
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