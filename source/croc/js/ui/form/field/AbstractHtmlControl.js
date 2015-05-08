/**
 * Абстракция над html полем (select, textarea, input)
 */
croc.Class.define('croc.ui.form.field.AbstractHtmlControl', {
    extend: croc.ui.Widget,
    
    implement: [
        croc.ui.form.field.IDisable,
        croc.ui.form.field.IHtmlControl
    ],
    
    include: [
        croc.ui.form.field.MStandardField,
        croc.ui.form.field.MStandardDisable
    ],
    
    events: {
        blur: null,
        focus: null
    },
    
    properties: {
        value: {
            value: null,
            field: '__value',
            apply: '_applyValue',
            option: true,
            event: true
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
        /**
         * Убрать фокус у элемента
         */
        blur: function() {
            this.getFieldElement().blur();
        },
        
        /**
         * Дать фокус элементу
         */
        focus: function() {
            this.getFieldElement().focus();
        },
        
        /**
         * Html-элемент поля
         * @return {jQuery}
         */
        getFieldElement: function() { throw 'abstract!'; },
        
        /**
         * Управляет ли компонент фокусом поля
         * @type {boolean}
         */
        managesFocus: function() {
            return this.__manageFocus;
        },
        
        /**
         * Применить заблокированное состояние поля
         * @param {boolean} value
         * @protected
         */
        _applyDisabled: function(value) {
            if (this.getElement()) {
                this.getFieldElement()[0].disabled = value;
            }
        },
        
        /**
         * @param value
         * @param old
         * @protected
         */
        _applyValue: function(value, old) {
            if (this.getElement()) {
                this.getFieldElement().val(value || '');
                this.getFieldElement().trigger('change');
            }
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.form.field.AbstractHtmlControl.superclass._getAddRenderData.apply(this, arguments),
                {
                    name: options.identifier || '',
                    tabIndex: options.tabIndex || options.tabIndex === 0 ? ' tabindex="' + options.tabIndex + '"' : ''
                });
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
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.AbstractHtmlControl.superclass._initWidget.call(this);
            
            this.__setUpBehavior();
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.AbstractHtmlControl.superclass._onPropertiesInitialized.apply(this, arguments);
            
            this.__value = options.value;
            this.__checkValueOnBlur = options._checkValueOnBlur;
            this.__manageFocus = options.manageFocus;
            
            if (this.getElement()) {
                if (!options.identifier) {
                    options.identifier = this.getFieldElement().attr('name') || null;
                }
                else if (options.identifier && !this.getFieldElement().attr('name')) {
                    this.getFieldElement().attr('name', this.getIdentifier());
                }
                
                if (this.getFieldElement()[0].disabled) {
                    this.setDisabled(true);
                }
                
                if (this.getValue() !== this._getFieldValue()) {
                    this.__value = this._getFieldValue() || null;
                }
            }
        },
        
        /**
         * @private
         */
        __setUpBehavior: function() {
            var fieldEl = this.getFieldElement();
            
            var handlers = {
                focus: function() {
                    if (this.__manageFocus) {
                        this.getElement().addClass('state_focus');
                        this.fireEvent('focus');
                    }
                }.bind(this),
                blur: function() {
                    if (this.__checkValueOnBlur && this.getValue() !== this._getFieldValue()) {
                        this.setValue(this._getFieldValue());
                    }
                    if (this.__manageFocus) {
                        this.getElement().removeClass('state_focus');
                        this.fireEvent('blur');
                    }
                }.bind(this)
            };
            
            if (!this.__checkValueOnBlur) {
                handlers.change = function() {
                    this.setValue(this._getFieldValue());
                }.bind(this);
            }
            
            fieldEl.on(handlers);
            
            if (this.__manageFocus && fieldEl.is(':focus')) {
                this.getElement().addClass('state_focus');
            }
        }
    }
});
