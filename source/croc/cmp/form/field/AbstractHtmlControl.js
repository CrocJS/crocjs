/**
 * Абстракция над html полем (select, textarea, input)
 */
croc.Class.define('croc.cmp.form.field.AbstractHtmlControl', {
    type: 'abstract',
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
         * @returns {jQuery}
         */
        getFieldElement: function() {
            return this.__fieldElement || (this.__fieldElement = this.fieldElement && $(this.fieldElement));
        },
        
        /**
         * Управляет ли компонент фокусом поля
         * @returns {boolean}
         */
        managesFocus: function() {
            return this._options.manageFocus;
        },
        
        /**
         * Возвращает внутреннее (сырое) значение поля
         * @protected
         */
        _getFieldValue: function() {
            return this.getFieldElement() && this.getFieldElement().val();
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.field.AbstractHtmlControl.superclass._initWidget.apply(this, arguments);
            
            var fieldEl = this.getFieldElement();
            
            fieldEl.on(this._options._checkValueOnBlur ? 'blur' : 'change', function() {
                this.setValue(this._getFieldValue(), {internal: true});
            }.bind(this));
            
            var internalFocus = false;
            if (this._options.manageFocus) {
                fieldEl.on({
                    focus: function() {
                        if (!internalFocus) {
                            internalFocus = true;
                            this.focus();
                            internalFocus = false;
                        }
                    }.bind(this),
                    blur: function() {
                        if (!internalFocus) {
                            internalFocus = true;
                            this.blur();
                            internalFocus = false;
                        }
                    }.bind(this)
                });
                
                if (fieldEl.is(':focus')) {
                    internalFocus = true;
                    this.focus();
                    internalFocus = false;
                }
                
                this.listenProperty('focused', function(value) {
                    if (!internalFocus) {
                        internalFocus = true;
                        if (value && !fieldEl.is(':focus')) {
                            fieldEl.focus();
                        }
                        else if (!value && fieldEl.is(':focus')) {
                            fieldEl.blur();
                        }
                        internalFocus = false;
                    }
                }, this);
            }
        }
    }
});
