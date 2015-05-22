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
        },
        
        /**
         * Пометить поле как "только для чтения"
         * @type {boolean}
         */
        readOnly: {
            model: true
        }
    },
    
    options: {
        /**
         * Отключить собственный автокомплит поля. true - при suggestion !== null
         * @type {boolean}
         */
        disableAutocomplete: {},
        
        /**
         * Максимальное кол-во знаков (аттрибут maxlength)
         * Если указаны правила валидации length или lengthRange, то определяется автоматически
         * @type {number}
         */
        maxLength: {
            type: 'number'
        },
        
        /**
         * Предназначено ли поле для ввода пароля
         * @type {boolean}
         */
        password: {}
    },
    
    members: {}
});
