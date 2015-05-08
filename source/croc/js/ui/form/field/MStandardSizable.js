croc.Mixin.define('croc.ui.form.field.MStandardSizable', {
    properties: {
        /**
         * Размер поля
         * @type {string}
         */
        size: {
            cssClass: true,
            type: 'string',
            getter: null,
            __setter: null,
            value: '1',
            option: true
        }
    }
});