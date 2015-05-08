/**
 * Реализация интерфейса {@link croc.ui.form.field.ITextField} для потомков класса {@link croc.ui.form.field.AbstractFieldWrapper}
 */
croc.Mixin.define('croc.ui.form.field.MTextFieldWrapper', {
    
    events: {
        blur: null,
        focus: null
    },
    
    preConstruct: function(options) {
        this.once('changeRendered', function() {
            var wrapped = this._getWrappedField();
            if (!croc.Class.check(wrapped, 'croc.ui.form.field.AbstractHtmlControl') || wrapped.managesFocus()) {
                wrapped.on('focus', this.fireEvent.bind(this, 'focus'));
                wrapped.on('blur', this.fireEvent.bind(this, 'blur'));
            }
        }, this);
    },
    
    members: {
        /**
         * Убрать фокус у элемента
         */
        blur: function() {
            if (this._getWrappedField()) {
                this._getWrappedField().blur();
            }
        },
        
        /**
         * Дать фокус элементу
         */
        focus: function() {
            if (this._getWrappedField()) {
                this._getWrappedField().focus();
            }
        },
        
        /**
         * Html-элемент поля
         * @returns {jQuery}
         */
        getFieldElement: function() {
            return this._getWrappedField() && this._getWrappedField().getFieldElement();
        },
        
        /**
         * Текстовый элемент
         * @returns {croc.ui.form.field.IField}
         */
        getTextField: function() {
            return this._getWrappedField();
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
