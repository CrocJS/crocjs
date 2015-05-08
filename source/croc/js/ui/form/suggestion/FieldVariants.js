/**
 * Выпадающий список поля с дополнительными вариантами для заполнения
 * Например: поля телефона и почты в офорлмении заказа, среди дополнитеьных вариантов все номера и мыла из ЛК
 */
croc.Class.define('croc.ui.form.suggestion.FieldVariants', {
    extend: croc.ui.form.suggestion.Default,
    
    options: {
        /**
         * Размер относительно размера target
         * @type {boolean}
         */
        autoSize: false,
        
        /**
         * @type {string}
         */
        mod: 'field-variants',
        
        /**
         * Модификатор цвета
         * @type {string}
         */
        scheme: 'blue',
        
        /**
         * @type {boolean}
         */
        showUnfilteredOnFocus: true
    },
    
    members: {
        /**
         * @param {croc.ui.form.field.TextField} field
         */
        initField: function(field) {
            croc.ui.form.suggestion.FieldVariants.superclass.initField.apply(this, arguments);
            this.removeDirtyState();
        }
    }
});