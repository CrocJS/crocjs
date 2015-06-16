/**
 * Абстракция над полем ввода
 */
croc.Class.define('croc.cmp.form.field.TextField', {
    extend: croc.cmp.form.field.AbstractTextField,
    
    properties: {
        /**
         * Предназначено ли поле для ввода пароля
         * @type {boolean}
         */
        masked: {
            value: true,
            model: true
        }
    },
    
    options: {
        /**
         * css class type_... for root DOM-element
         * @type {string}
         */
        cssType: 'text',
        
        /**
         * Отключить собственный автокомплит поля. true - при suggestion !== null
         * @type {boolean}
         */
        disableAutocomplete: {},
        
        /**
         * Предназначено ли поле для ввода пароля
         * @type {boolean}
         */
        password: {}
    }
});
