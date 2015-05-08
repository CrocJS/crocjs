/**
 * Select на базе LinkField и тултипа
 */
croc.Class.define('croc.ui.form.field.CustomLinkSelect', {
    extend: croc.ui.form.field.AbstractLinkField,
    
    options: {
        /**
         * Текст при отсутствии значения
         * @type {string}
         */
        emptyText: 'Выберете значение',
        
        /**
         * Массив опций, элементом массива может быть значение, которое интерпретируется и как текст опции, а также
         * массив из двух элементов - значение и текст
         * @type {Array.<Array|*>}
         */
        options: null,
        
        /**
         * Простое значение (value.value) поля
         * @type {string|number}
         */
        plainValue: null,
        
        /**
         * В тултипе должны быть настоящие ссылки
         * @type {boolean}
         */
        realLinks: false,
        
        /**
         * Дополнительные опции тултипа
         * @type {Object}
         */
        tooltipConf: null
    },
    
    members: {
        /**
         * Задать новый список значений
         * @param {Array.<Array|*>} options
         */
        setOptions: function(options) {
            this.__options.replaceAll(this.__initOptions(options));
        },
        
        /**
         * изменить простое значение
         * @type {string} value
         */
        setPlainValue: function(value) {
            this.setValue(this.__getOptionByValue(value));
        },
        
        /**
         * Применить новое значение
         * @param value
         * @param old
         * @protected
         */
        _applyValue: function(value, old) {
            croc.ui.form.field.CustomLinkSelect.superclass._applyValue.apply(this, arguments);
            
            if (this.__tooltip) {
                this.__tooltip.getSelection().setSingleItem(value);
            }
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.CustomLinkSelect.superclass._initWidget.call(this);
            
            this.__tooltip = new croc.ui.tooltip.Links(croc.Object.mergeConf({
                linksType: this.__realLinks ? 'real' : 'pseudo',
                links: this.__options,
                mod: 'link-select',
                extraCls: 'size_' + this.getSize(),
                autoClose: false,
                triggerOptions: croc.ui.tooltip.Tooltip.TRIGGER_CLICK,
                position: 'bottom',
                target: this.getElement(),
                listeners: {
                    click: function(item) {
                        this.setValue(item);
                    }.bind(this)
                }
            }, this.__tooltipConf));
            
            if (this.getValue()) {
                this.__tooltip.getSelection().setSingleItem(this.getValue());
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__emptyText = options.emptyText;
            this.__realLinks = options.realLinks;
            this.__tooltipConf = options.tooltipConf;
            
            this.__options = new croc.data.ObservableArray({
                original: options.options ? this.__initOptions(options.options) : []
            });
            
            croc.ui.form.field.CustomLinkSelect.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (options.plainValue) {
                this.setPlainValue(options.plainValue);
            }
        },
        
        /**
         * @param value
         * @param {boolean} [returnIndex=false]
         * @returns {*}
         * @private
         */
        __getOptionByValue: function(value, returnIndex) {
            var index = _.findIndex(this.__options.getArray(), function(option) {
                return option.value === value;
            });
            
            return returnIndex ? index : index === -1 ? null : this.__options.getItem(index);
        },
        
        /**
         * @param {Array.<Array|*>} options
         * @private
         */
        __initOptions: function(options) {
            return options.map(function(option) {
                var isArr = Array.isArray(option);
                
                if (isArr || typeof option !== 'object') {
                    var value = isArr ? option[0] : option;
                    var text = String(isArr ? option[1] : option);
                    var icon = (isArr && option[2]) || '';
                    if (value === null && (!text || !isArr)) {
                        text = this.__emptyText;
                    }
                    option = {text: text, value: value, $$icon: icon};
                }
                
                return option;
            }, this);
        }
    }
});
