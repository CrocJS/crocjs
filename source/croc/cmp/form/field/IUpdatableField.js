/**
 * api-ru Поле содержащее событие update
 * api-en Field, which includes update event.
 */
croc.Interface.define('croc.cmp.form.field.IUpdatableField', {
    extend: croc.cmp.form.field.IField,
    
    properties: {
        /**
         * api-ru Мгновенное значение поля
         * api-en Instant field value.
         * @type {*}
         */
        instantValue: {
            getter: null,
            event: true
        }
    }
});