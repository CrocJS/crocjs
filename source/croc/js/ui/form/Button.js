/**
 * Кнопка
 */
croc.Class.define('croc.ui.form.Button', {
    extend: croc.ui.Widget,
    
    events: {
        /**
         * Кнопка была нажата
         */
        execute: null
    },
    
    properties: {
        /**
         * активна ли кнопка
         * @type {boolean}
         */
        active: {
            cssClass: 'state_active',
            type: 'boolean',
            value: false,
            event: true,
            option: true
        },
        
        /**
         * Заблокирована ли кнопка
         * @type {boolean}
         */
        disabled: {
            cssClass: 'state_disabled',
            type: 'boolean',
            value: false,
            field: '__disabled',
            apply: function(disabled) {
                if (this.__inputEl) {
                    this.__inputEl.prop('disabled', disabled);
                }
            },
            option: true,
            event: true
        },
        
        /**
         * Конфигурация иконки
         * @type {Object}
         */
        icon: {
            type: 'object',
            field: '__icon',
            apply: '__applyTextContent',
            option: true
        },
        
        /**
         * Кнопка в состоянии загрузки
         * @type {boolean}
         */
        loading: {
            cssClass: 'state_loading',
            type: 'boolean',
            option: true
        },
        
        /**
         * Радиокнопка - при клике меняется свойство active
         * @type {boolean}
         */
        radio: {
            type: 'boolean',
            value: false,
            apply: function(value) {
                if (!value) {
                    this.setActive(false);
                }
            },
            option: true
        },
        
        /**
         * Цветовая схема кнопки
         * @type {string}
         */
        'set': {
            cssClass: true,
            type: 'string',
            value: 'system',
            option: true
        },
        
        /**
         * Цветовая схема кнопки
         * @type {string}
         */
        scheme: {
            cssClass: true,
            type: 'string',
            value: 'gray',
            option: true
        },
        
        /**
         * Размер кнопки
         * @type {string}
         */
        size: {
            cssClass: true,
            type: 'string',
            value: '2',
            option: true
        },
        
        /**
         * Текст кнопки, если не задан, то равен value
         * @type {string}
         */
        text: {
            type: 'string',
            field: '__text',
            apply: '__applyTextContent',
            option: true
        },
        
        /**
         * Атрибут value кнопки
         * @type {string}
         */
        value: {
            type: 'string',
            field: '__value',
            apply: function(value) {
                if (this.__inputEl) {
                    this.__inputEl.attr('value', value || '');
                }
            },
            option: true
        }
    },
    
    options: {
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<span class="b-sbutton set_system{cls}">' +
        '   <span class="b-sbutton-text">{text}</span>{button}' +
        '</span>',
        
        /**
         * Предотвратить стандартное поведение кнопки (sumbit формы)
         * @type {boolean}
         */
        preventDefault: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Предотвратить всплывание события mousedown и click
         * @type {boolean}
         */
        stopPropagation: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Тип кнопки: button, submit
         * @type {string}
         */
        type: {
            check: ['button', 'submit']
        }
    },
    
    members: {
        /**
         * Тип кнопки
         * @return {string}
         */
        getType: function() {
            return this.__type;
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return {
                type: options.type,
                text: this.__getTextContent(options.text, options.icon),
                value: options.value || '',
                disabled: options.disabled ? ' disabled="disabled"' : '',
                button: !options.type ? '' :
                '<input type="' + options.type + '" class="b-sbutton-input" value="' + (options.value || '') + '"' +
                (options.disabled ? ' disabled="disabled"' : '') + '>'
            };
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.Button.superclass._initWidget.call(this);
            
            this.getElement().click(function(e) {
                if (!this.getDisabled() && !this.getLoading()) {
                    this.fireEvent('execute', e, this);
                    
                    if (this.getRadio()) {
                        this.setActive(!this.getActive());
                    }
                    
                    if (this.__preventDefault) {
                        e.preventDefault();
                    }
                }
                else {
                    e.preventDefault();
                }
                if (this.__stopPropagation) {
                    e.stopPropagation();
                }
            }.bind(this));
            
            if (this.__stopPropagation) {
                this.getElement().mousedown(function(e) {
                    e.stopPropagation();
                });
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__type = options.type;
            this.__preventDefault = options.preventDefault;
            this.__stopPropagation = options.stopPropagation;
            
            croc.ui.form.Button.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (this.getElement()) {
                if (this.__inputEl) {
                    this.__value = this.__inputEl.attr('value') || null;
                    
                    if (this.__inputEl.prop('disabled') && !this.getDisabled()) {
                        this.__disabled = true;
                    }
                    else if (!this.__inputEl.prop('disabled') && this.getDisabled()) {
                        this.__inputEl.prop('disabled', true);
                    }
                    
                    this.__type = this.__inputEl.attr('type') || this.__type;
                }
                
                if (this.__textEl) {
                    var iconEl = this.__textEl.find('>.g-icon');
                    if (iconEl.length) {
                        this.__icon = croc.ui.Render.parseIcon(iconEl);
                        this.__text = this.__icon.text.trim();
                        delete this.__icon.text;
                    }
                    else {
                        this.__text = this.__textEl.html().trim();
                    }
                }
            }
            else {
                if (!this.__value && this.__type === 'submit') {
                    this.__value = this.__text;
                }
            }
        },
        
        /**
         * Назначить элемент виджету
         * @param {jQuery} el
         * @protected
         */
        _setElement: function(el) {
            croc.ui.form.Button.superclass._setElement.apply(this, arguments);
            
            this.__inputEl = el.find('input');
            if (!this.__inputEl.length) {
                this.__inputEl = null;
            }
            
            this.__textEl = el.find('.b-sbutton-text');
            if (!this.__textEl.length) {
                this.__textEl = null;
            }
        },
        
        /**
         * @private
         */
        __applyTextContent: function() {
            if (this.__textEl) {
                this.__textEl.html(this.__getTextContent(this.getText(), this.getIcon()));
            }
        },
        
        /**
         * @param text
         * @param icon
         * @returns {string}
         * @private
         */
        __getTextContent: function(text, icon) {
            if (icon) {
                icon = _.assign({button: true, text: text}, icon);
            }
            return icon ? croc.ui.Render.icon(icon) : text || '';
        }
    }
});

croc.services.Resources.loadImage('/croc/images/blocks/b-sbutton/state_loading.gif', true);