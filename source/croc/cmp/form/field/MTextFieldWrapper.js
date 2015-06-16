/**
 * Реализация интерфейса {@link croc.cmp.form.field.ITextField} для потомков класса {@link croc.cmp.form.field.AbstractFieldWrapper}
 */
croc.Mixin.define('croc.cmp.form.field.MTextFieldWrapper', {
    properties: {
        focused: {
            model: true
        }
    },
    
    preConstruct: function(options) {
        this.on('initChild', function(item) {
            if (item.getSection() === 'wrapped' &&
                (!croc.Class.check(item, 'croc.cmp.form.field.AbstractHtmlControl') || item.managesFocus())) {
                this._addExtendingWrapperOptions('focused');
            }
        }, this);
    },
    
    members: {
        /**
         * Убрать фокус у элемента
         */
        blur: function() {
            this.setFocused(false);
        },
        
        /**
         * Дать фокус элементу
         */
        focus: function() {
            this.setFocused(true);
        },
        
        /**
         * Html-элемент поля
         * @returns {jQuery}
         */
        getFieldElement: function() {
            return this._wrapped && this._wrapped.getFieldElement();
        },
        
        /**
         * Текстовый элемент
         * @returns {croc.cmp.form.field.IField}
         */
        getTextField: function() {
            return this._wrapped;
        },
        
        /**
         * Пробелы на концах значения являются важными и их нельзя обрезать
         * @returns {boolean}
         */
        keepWhiteSpace: function() {
            return false;
        }
    }
});
