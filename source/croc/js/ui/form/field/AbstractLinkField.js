/**
 * Поле-псевдоссылка
 */
croc.Class.define('croc.ui.form.field.AbstractLinkField', {
    extend: croc.ui.Widget,
    
    implement: [
        croc.ui.form.field.IField,
        croc.ui.form.field.IDisable,
        croc.ui.form.field.ISizable
    ],
    
    include: [
        croc.ui.form.field.MStandardField,
        croc.ui.form.field.MStandardDisable,
        croc.ui.form.field.MStandardSizable
    ],
    
    properties: {
        /**
         * значение поля
         * @type {{value: *, text: string, [$$icon]: Object}}
         */
        value: {
            type: 'object',
            field: '__value',
            apply: '_applyValue',
            transform: '_transformValue',
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * Иконка при отсутствии значения
         * @type {Object}
         */
        emptyIcon: {
            type: 'object'
        },
        
        /**
         * Текст при отсутствии значения
         * @type {string}
         */
        emptyText: {
            type: 'string'
        },
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<span class="g-pseudo type_field g-link {iconCls}{cls}">' +
        '   {icon}<span class="g-pseudo-h">{title}</span>' +
        '   <input type="hidden" value="{value}" name="{name}">' +
        '</span>',
        
        /**
         * Зависимость размера иконки от размера поля
         * @type {Object}
         */
        sizeToIconSize: {
            type: 'object',
            value: {
                '1': '16',
                '2': '18',
                '3': '18',
                '4': '26',
                '5': '26'
            }
        },
        
        /**
         * Сообщения об ошибках валидации (validatorId => message)
         * @type {Object.<string, string>}
         */
        validationMessages: {
            value: {
                required: 'Выберите значение'
            }
        }
    },
    
    members: {
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @type {string|Array}
         */
        getPlainValue: function() {
            var value = this.getValue();
            return value && value.value;
        },
        
        /**
         * Возвращает элемент g-pseudo-h
         * @returns {jQuery}
         */
        getTextElement: function() {
            return this.__textElement;
        },
        
        /**
         * Применить новое значение
         * @param value
         * @param old
         * @protected
         */
        _applyValue: function(value, old) {
            if (this.__renderValueDisabled || !this.getElement()) {
                return;
            }
            
            //value
            if (this.__input && this.__input.val() !== value.value) {
                this.__input.val(value.value || '');
            }
            
            //title
            if (this.__textElement && this.__textElement.html() !== value.text) {
                this.__textElement.html(value.text);
            }
            
            //icon
            var oldIcon = this.__renderIcon(old);
            if (oldIcon) {
                this.getElement().removeClass(oldIcon.topCls);
            }
            
            this.getElement().find('.g-icon-h').remove();
            var newIcon = this.__renderIcon(value);
            
            if (newIcon) {
                this.getElement().addClass(newIcon.topCls);
                this.getElement().prepend(newIcon.content);
            }
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            var value = this.getValue();
            var icon = this.__renderIcon(value);
            return {
                name: this.getIdentifier() || '',
                value: value.value || '',
                title: value.text || options.emptyText,
                iconCls: icon ? icon.topCls : '',
                icon: icon ? icon.content : ''
            };
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.AbstractLinkField.superclass._initWidget.call(this);
            
            this.__textElement = this.getElement().find('.g-pseudo-h');
            this.__input = this.getElement().find('input');
            
            if (!this.isHtmlGenerated()) {
                var value = this.__input.val();
                if (value) {
                    var icon = this.getElement().find('.g-icon-h');
                    
                    this.__renderValueDisabled = true;
                    this.setValue(_.assign(this.getValue() || {}, {
                        value: value,
                        text: this.__textElement.html(),
                        $$icon: icon.length ? {
                            html: '<span class="g-icon ' + (this.getElement().data('iconCls') || '') + '">' + icon[0].outerHTML + '</span>'
                        } : null
                    }));
                    this.__renderValueDisabled = false;
                }
            }
            
            //disabled link
            this.getElement().click(function(e) {
                if (this.getDisabled()) {
                    e.stopImmediatePropagation();
                }
            }.bind(this));
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.AbstractLinkField.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (!options.identifier && this.getElement()) {
                var input = this.getElement().find('input');
                if (input.attr('name')) {
                    options.identifier = input.attr('name');
                }
            }
            
            this.__sizeToIconSize = options.sizeToIconSize;
            this.__emptyText = options.emptyText;
            this.__emptyIcon = options.emptyIcon;
            this.__value = this._transformValue(options.value);
        },
        
        /**
         * Трансформировать значение
         * @param {Object} value
         * @returns {Object}
         * @private
         */
        _transformValue: function(value) {
            if (!value) {
                value = {value: null};
            }
            if (!value.text) {
                value.text = this.__emptyText;
            }
            if (!value.$$icon) {
                value.$$icon = this.__emptyIcon;
            }
            
            return value;
        },
        
        /**
         * @param {Object} icon
         * @returns {{topCls: string, content: string}}
         * @private
         */
        __renderIcon: function(value) {
            if (!value || !value.$$icon) {
                return null;
            }
            
            var icon = value.$$icon.size || !this.__sizeToIconSize || !this.getSize() ? value.$$icon :
                _.assign({size: this.__sizeToIconSize[this.getSize()]}, value.$$icon);
            icon = $(croc.ui.Render.icon(icon));
            return {
                topCls: icon[0].className,
                content: icon.html()
            };
        }
    }
});
