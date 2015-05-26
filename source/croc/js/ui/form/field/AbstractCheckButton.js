/**
 * Базовый класс для чекбокса и радиокнопки
 */
croc.Class.define('croc.ui.form.field.AbstractCheckButton', {
    type: 'abstract',
    extend: croc.ui.form.field.AbstractHtmlControl,
    implement: croc.ui.form.field.ISizable,
    include: croc.ui.form.field.MStandardSizable,
    
    properties: {
        /**
         * отмечена ли кнопка
         * @type {boolean}
         */
        checked: {
            getter: function() {
                return !!this.getValue();
            },
            setter: function(checked) {
                if (this.__booleanValue === undefined && this.__permanentValue === undefined) {
                    this.__setChecked = checked;
                }
                else {
                    this.setValue(this.__booleanValue ? checked : checked ? this.__permanentValue : null);
                }
            },
            option: true,
            event: true
        },
        
        /**
         * Цветовая схема
         * @type {string}
         */
        scheme: {
            cssClass: true,
            type: 'string',
            value: 'system',
            option: true
        },
        
        /**
         * @type {string|boolean}
         */
        value: {
            type: ['string', 'boolean'],
            inherit: true
        }
    },
    
    options: {
        /**
         * Если true, то свойство value будет равняться свойству checked. Иначе, value будет null если checked === false и
         * будет равен permanentValue в противном случае.
         * Если permanentValue=null, то booleanValue=true
         * @type {boolean}
         */
        booleanValue: {
            type: 'boolean',
            value: true
        },
        
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
         * Возвращает значение противоположное текущему
         * @type {boolean|string}
         */
        getOppositeValue: function() {
            return this.__booleanValue ? !this.getChecked() :
                this.getChecked() ? null : this.getPermanentValue();
        },
        
        /**
         * Атрибут value поля
         * @returns {string}
         */
        getPermanentValue: function() {
            return this.__permanentValue;
        },
        
        /**
         * @param value
         * @param old
         * @protected
         */
        _applyValue: function(value, old) {
            if (this.getElement()) {
                this.getFieldElement().prop('checked', !!value);
                this.getElement().toggleClass('state_checked', !!value);
                this.getFieldElement().trigger('change');
            }
            this.fireEvent('changeChecked', this.getChecked(), !this.getChecked());
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.form.field.AbstractCheckButton.superclass._getAddRenderData.apply(this, arguments),
                {
                    checked: this.getChecked() ? 'checked="checked"' : '',
                    stateChecked: this.getChecked() ? 'state_checked' : '',
                    permanentValue: this.getPermanentValue() || ''
                });
        },
        
        /**
         * Возвращает внутреннее (сырое) значение поля
         * @protected
         */
        _getFieldValue: function() {
            var element = this.getFieldElement();
            return element && element.prop('checked') ?
                (this.__booleanValue ? true : this.__permanentValue) :
                (this.__booleanValue ? false : null);
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.AbstractCheckButton.superclass._initWidget.call(this);
            
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
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            if (this.getElement()) {
                if (!options.permanentValue) {
                    options.permanentValue = this.getFieldElement()[0].getAttribute('value');
                }
                else if (!this.getFieldElement()[0].getAttribute('value')) {
                    this.getFieldElement().val(options.permanentValue);
                }
            }
            
            if (!options.permanentValue && !options.booleanValue) {
                options.booleanValue = true;
            }
            
            if (typeof options.checked === 'boolean') {
                options.value = options.booleanValue ? options.checked : (options.checked ? options.permanentValue : null);
            }
            
            this.__booleanValue = options.booleanValue;
            this.__permanentValue = options.permanentValue;
            
            if (this.__setChecked) {
                this.setChecked(this.__setChecked);
            }
            
            croc.ui.form.field.AbstractCheckButton.superclass._onPropertiesInitialized.apply(this, arguments);
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
                this.getElement().addClass('state_active');
                
                var descriptor = this._getDisposer().addListener($(document), 'mousedown mouseup', function(e) {
                    if (e.type === 'mousedown' && (container[0] === e.target || $.contains(container[0], e.target))) {
                        return;
                    }
                    this._getDisposer().disposeItem(descriptor);
                    this.getElement().removeClass('state_active');
                }.bind(this));
            }.bind(this));
            
            container.hover(function() {
                this.getElement().toggleClass('state_hover');
            }.bind(this));
        }
    }
});
