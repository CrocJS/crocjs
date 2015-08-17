/**
 * api-ru Абстракция над полем ввода
 * api-en Abstraction over the input field.
 */
croc.Class.define('croc.cmp.form.field.TextField', {
    extend: croc.cmp.form.field.AbstractTextField,
    
    properties: {
        /**
         * api-ru Предназначено ли поле для ввода пароля
         * api-en Is field intended for enter a password?
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
         * api-ru Отключить собственный автокомплит поля. true - при suggestion !== null
         * api-en Turn off is the native field autocomplete. true - by suggestion !== null
         * @type {boolean}
         */
        disableAutocomplete: {},
        
        /**
         * api-ru Предназначено ли поле для ввода пароля
         * api-en Is field intended for enter a password?
         * @type {boolean}
         */
        password: {}
    },
    
    members: {
        _initModel: function() {
            croc.cmp.form.field.TextField.superclass._initModel.apply(this, arguments);
            //console.log(this.getMasked());
        }
    }
});
