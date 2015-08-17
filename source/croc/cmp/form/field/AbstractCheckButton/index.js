/**
 * api-ru Базовый класс для чекбокса и радиокнопки
 * api-en Base class for checkbox and radiobutton.
 */
croc.Class.define('croc.cmp.form.field.AbstractCheckButton', {
    type: 'abstract',
    extend: croc.cmp.form.field.AbstractHtmlControl,
    implement: croc.cmp.form.field.ISizable,
    
    properties: {
        /**
         * api-ru Цветовая схема
         * api-en Color scheme.
         * @type {string}
         */
        scheme: {
            type: 'string',
            value: 'system',
            model: true
        },
        
        /**
         * @type {boolean}
         */
        value: {
            type: 'boolean',
            value: false,
            model: true
        }
    },
    
    options: {
        /**
         * api-ru мета-данные для добавления дочернего виджета
         * api-en Metadata for adding a child widget.
         * @type {object}
         */
        meta: {
            value: {
                openTooltipAnyway: true
            }
        },
        
        /**
         * api-ru атрибут value поля
         * api-en Attribute value of field.
         * @type {string}
         */
        permanentValue: {
            type: 'string'
        },
        
        /**
         * Field size
         * '1' and '2' values map to size_1, others map to size_2
         * @type {string}
         */
        size: {
            check: ['1', '2', '3', '4', '5'],
            value: '1'
        }
    },
    
    members: {
        /**
         * Field size
         * @returns {string}
         */
        getSize: function() {
            return this._options.size;
        },
        
        /**
         * type of check button
         * @returns {string}
         */
        getButtonType: function() {
            throw 'abstract!';
        },
        
        /**
         * api-ru Атрибут value поля
         * api-en Attribute value of field.
         * @returns {string}
         */
        getPermanentValue: function() {
            return this._options.permanentValue;
        },
        
        /**
         * api-ru Возвращает внутреннее (сырое) значение поля
         * api-en Returns inside (raw) value of field.
         * @protected
         */
        _getFieldValue: function() {
            var element = this.getFieldElement();
            return element && element.prop('checked');
        },
        
        /**
         * api-ru Инициализация виджета после его отрисовки в DOM
         * api-en Initialization of widget after its rendering in DOM.
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.field.AbstractCheckButton.superclass._initWidget.call(this);
            
            this.__setUpAbstractCheckButtonBehavior();
            
            //IE bug fix
            if (croc.util.Browser.isIE('<=10')) {
                this._getDisposer().setTimeout(function() {
                    if (this.getValue() !== this._getFieldValue()) {
                        this.setValue(this._getFieldValue());
                    }
                }.bind(this), 100);
            }
        },
        
        /**
         * @private
         */
        __setUpAbstractCheckButtonBehavior: function() {
            var container = this.getElement().parents('label:last');
            if (!container.length) {
                container = this.getElement();
            }
            
            container.mousedown(function() {
                this._model.set('active', true);
                
                var descriptor = this._getDisposer().addListener($(document), 'mousedown mouseup', function(e) {
                    if (e.type === 'mousedown' && (container[0] === e.target || $.contains(container[0], e.target))) {
                        return;
                    }
                    this._getDisposer().disposeItem(descriptor);
                    this._model.set('active', false);
                }.bind(this));
            }.bind(this));
            
            container.hover(function() {
                this._model.set('hover', !this._options.hover);
            }.bind(this));
        }
    }
});
