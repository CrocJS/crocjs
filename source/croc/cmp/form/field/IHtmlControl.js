/**
 * Интерфейс для полей, которые являются обёртками над html-полями (input, textarea, select etc)
 */
croc.Interface.define('croc.cmp.form.field.IHtmlControl', {
    extend: croc.cmp.form.field.IField,
    
    properties: {
        /**
         * @type {boolean}
         */
        setFocused: {
            event: true
        }
    },
    
    members: {
        /**
         * Убрать фокус у элемента
         */
        blur: function() {},
        
        /**
         * Дать фокус элементу
         */
        focus: function() {},
        
        /**
         * Html-элемент поля
         * @returns {jQuery}
         */
        getFieldElement: function() {}
    }
});
