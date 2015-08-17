/**
 * api-ru Интерфейс для полей, которые являются обёртками над html-полями (input, textarea, select etc)
 * api-en Interface for fields, which are wrappers over html-fields (input, textarea, select etc).
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
         * api-ru Убрать фокус у элемента
         * api-en Remove element focus.
         */
        blur: function() {},
        
        /**
         * api-ru Дать фокус элементу
         * api-en Set focus to element.
         */
        focus: function() {},
        
        /**
         * api-ru Html-элемент поля
         * api-en Html-element of field.
         * @returns {jQuery}
         */
        getFieldElement: function() {}
    }
});
