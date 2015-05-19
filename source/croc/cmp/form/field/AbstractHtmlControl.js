/**
 * Абстракция над html полем (select, textarea, input)
 */
croc.Class.define('croc.cmp.form.field.AbstractHtmlControl', {
    extend: croc.cmp.Widget,
    
    implement: [
        croc.cmp.form.field.IDisable,
        croc.cmp.form.field.IHtmlControl
    ],
    
    include: croc.cmp.form.field.MStandardField,
    
    properties: {
        /**
         * Is field disabled
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
        },
        
        /**
         * @type {boolean}
         */
        focused: {
            type: 'boolean',
            model: true
        }
    },
    
    options: {
        /**
         * Управлять фокусом поля
         * @type {boolean}
         */
        manageFocus: true,
        
        /**
         * атрибут tabindex
         * @type {string|number}
         */
        tabIndex: {},
        
        /**
         * Таймаут перед назначением классов state_valid/state_error
         * @type {number}
         */
        _changeValidClassTimeout: 50,
        
        /**
         * Использовать проверку изменения значения по событию blur, вместо change
         * @type {boolean}
         */
        _checkValueOnBlur: false
    },
    
    members: {
        blur: function() {
            this.setFocused(false);
        },
        
        focus: function() {
            this.setFocused(true);
        },
        
        /**
         * Html-элемент поля
         * @return {jQuery}
         */
        getFieldElement: function() { throw 'abstract!'; }
    }
});
