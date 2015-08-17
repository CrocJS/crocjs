/**
 * api-ru Абстракция над html полем (select, textarea, input)
 * api-en Abstraction over html field (select, textarea, input).
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
         * api-ru Управлять фокусом поля
         * api-en Manage field focus.
         * @type {boolean}
         */
        manageFocus: true,
        
        /**
         * api-ru атрибут tabindex
         * api-en Tabindex attribute.
         * @type {string|number}
         */
        tabIndex: {},
        
        /**
         * api-ru Таймаут перед назначением классов state_valid/state_error
         * api-en Timeout before setting classes state_valid/state_error.
         * @type {number}
         */
        _changeValidClassTimeout: 50,
        
        /**
         * api-ru Использовать проверку изменения значения по событию blur, вместо change
         * api-en Use check of value change on blur event instead of change
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
         * api-ru Html-элемент поля
         * api-en Html-element of field 
         * @returns {jQuery}
         */
        getFieldElement: function() {
            return this.__fieldElement || (this.__fieldElement = this.fieldElement && $(this.fieldElement));
        },
        
        /**
         * api-ru Управляет ли компонент фокусом поля
         * api-en Is field focus managed by component?
         * @returns {boolean}
         */
        managesFocus: function() {
            return this._options.manageFocus;
        },
        
        /**
         * api-ru Возвращает внутреннее (сырое) значение поля
         * api-en Return internal (raw) field value.
         * @protected
         */
        _getFieldValue: function() {
            return this.getFieldElement() && this.getFieldElement().val();
        },
        
        /**
         * api-ru Инициализация виджета после его отрисовки в DOM
         * api-en Initialization of widget after its rendering in DOM.
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
