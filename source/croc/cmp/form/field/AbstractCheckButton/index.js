/**
 * Базовый класс для чекбокса и радиокнопки
 */
croc.Class.define('croc.cmp.form.field.AbstractCheckButton', {
    type: 'abstract',
    extend: croc.cmp.form.field.AbstractHtmlControl,
    implement: croc.cmp.form.field.ISizable,
    
    properties: {
        /**
         * Цветовая схема
         * @type {string}
         */
        scheme: {
            type: 'string',
            value: 'system',
            model: true
        },
        
        /**
         * Field size
         * '1' and '2' values map to size_1, others map to size_2
         * @type {string}
         */
        size: {
            check: ['1', '2', '3','4', '5'],
            __setter: null,
            value: '1',
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
         * мета-данные для добавления дочернего виджета
         * @type {object}
         */
        meta: {
            value: {
                openTooltipAnyway: true
            }
        },
        
        /**
         * атрибут value поля
         * @type {string}
         */
        permanentValue: {
            type: 'string'
        }
    },
    
    members: {
        /**
         * type of check button
         * @returns {string}
         */
        getButtonType: function() {
            throw 'abstract!';
        },
        
        /**
         * Атрибут value поля
         * @returns {string}
         */
        getPermanentValue: function() {
            return this._options.permanentValue;
        },
        
        /**
         * Возвращает внутреннее (сырое) значение поля
         * @protected
         */
        _getFieldValue: function() {
            var element = this.getFieldElement();
            return element && element.prop('checked');
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
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
