/**
 * Select на базе LinkField и тултипа
 */
croc.Class.define('croc.ui.form.field.LinkSelect', {
    extend: croc.ui.form.field.AbstractFieldWrapper,
    implement: [
        croc.ui.form.field.ISizable,
        croc.ui.form.field.IDisable
    ],
    include: [
        croc.ui.form.field.MDisableFieldWrapper,
        croc.ui.form.field.MSizableFieldWrapper
    ],
    
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
         * В тултипе должны быть настоящие ссылки
         * @type {boolean}
         */
        realLinks: false,
        
        /**
         * Дополнительные опции тултипа
         * @type {Object}
         */
        tooltipConf: null,
        
        /**
         * проксировать ли событие changeValue
         * @type {boolean}
         */
        _proxyChangeValueEvent: false,
        
        /**
         * Если контейнер является враппером над одним виджетом без внешнего html. Если передано true,
         * то считается что оборачивается секция по умолчанию, иначе должна быть передана оборачиваемая
         * секция.
         * @type {string|boolean}
         */
        _wrapSection: true
    },
    
    members: {
        /**
         * Значение поля
         * @return {*}
         */
        getValue: function() {
            var wrappedField = this._getWrappedField();
            return !wrappedField ? croc.ui.form.field.LinkSelect.superclass.getValue.apply(this, arguments) :
            wrappedField.getValue() && wrappedField.getValue().value;
        },
        
        /**
         * Возвращает текст на основе переданного значения
         * @param value
         * @returns {string}
         */
        getTextByValue: function(value) {
            var text = null;
            this._options.options.some(function(option) {
                if (Array.isArray(option) ? option[0] === value : option.value === value) {
                    text = Array.isArray(option) ? option[1] || option[0] : option.text;
                    return true;
                }
            });
            return text;
        },
        
        /**
         * Задать новый список значений
         * @param {Array.<Array|*>} options
         */
        setOptions: function(options) {
            if (this._getWrappedField()) {
                this._getWrappedField().setOptions(options);
            }
            else {
                this._options.options = options;
            }
        },
        
        /**
         * Изменить значение поля
         * @param {*} value
         */
        setValue: function(value) {
            if (this._getWrappedField()) {
                this._getWrappedField().setPlainValue(value);
            }
            else {
                this._options.value = value;
            }
        },
        
        /**
         * Секция дочерних элементов по-умолчанию
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return 'wrappedField';
        },
        
        /**
         * Метод вызывается при добавлении нового дочернего элемента
         * @param {string} section
         * @param {croc.ui.Widget} item
         * @protected
         */
        _onAddItem: function(section, item) {
            croc.ui.form.field.LinkSelect.superclass._onAddItem.apply(this, arguments);
            if (section === 'wrappedField') {
                item.on('changeValue', function(value, oldValue) {
                    this.fireEvent('changeValue', value && value.value, oldValue && oldValue.value);
                }, this);
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.LinkSelect.superclass._onPropertiesInitialized.apply(this, arguments);
            
            this._addExtendingWrapperOptions('emptyText', 'options', 'tooltipConf', 'mod', 'extraCls', 'realLinks');
            
            var wrappedField = this._extendWithWrapperOptions({xtype: croc.ui.form.field.CustomLinkSelect});
            if (wrappedField.value) {
                wrappedField.plainValue = wrappedField.value;
                delete wrappedField.value;
            }
            
            options.items.wrappedField = [wrappedField];
        }
    }
});
