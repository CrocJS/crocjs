/**
 * Интерфейс для полей, которые являются обёртками над html-полями (input, textarea, select etc)
 */
croc.Interface.define('croc.ui.form.field.IHtmlControl', {
    extend: croc.ui.form.field.IField,
    
    events: {
        blur: null,
        focus: null
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
