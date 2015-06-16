/**
 * Обёртка для поля
 */
croc.Class.define('croc.ui.form.field.AbstractFieldWrapper', {
    type: 'abstract',
    extend: croc.ui.Container,
    implement: croc.ui.form.field.IField,
    include: croc.ui.form.field.MStandardField,
    
    options: {
        /**
         * проксировать ли событие changeValue
         * @type {boolean}
         */
        _proxyChangeValueEvent: true,
        
        /**
         * Опции для обёрнутого виджета
         * @type {Object}
         */
        _wrappedConf: {}
    },
    
    construct: function(options) {
        this.__proxyChangeValueEvent = options._proxyChangeValueEvent;
        this.__extendingWrapperOptions = ['value', 'identifier'];
        croc.ui.form.field.AbstractFieldWrapper.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Если возвращает объект, то он примешивается к значениям формы
         * @returns {Object}
         */
        exportValues: function() {
            return this._wrappedField.exportValues.apply(this._wrappedField, arguments);
        },
        
        /**
         * Секция дочерних элементов по-умолчанию
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return this._options._wrapSection ? 'wrappedField' :
                croc.ui.form.field.AbstractFieldWrapper.superclass.getDefaultItemsSection.apply(this, arguments);
        },
        
        /**
         * Ключ, который будет представлять значение поля в данных формы
         * @returns {string}
         */
        getIdentifier: function() {
            return this._wrappedField && _.contains(this.__extendingWrapperOptions, 'identifier') ?
                this._wrappedField.getIdentifier.apply(this._wrappedField, arguments) :
                croc.ui.form.field.AbstractFieldWrapper.superclass.getIdentifier.apply(this, arguments);
        },
        
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @type {string|Array}
         */
        getPlainValue: function() {
            return this._wrappedField ?
                this._wrappedField.getPlainValue.apply(this._wrappedField, arguments) :
                this._options.value;
        },
        
        /**
         * Находится ли поле в валидном состоянии
         * @return {boolean|null}
         */
        getValid: function() {
            return this._wrappedField ?
                this._wrappedField.getValid.apply(this._wrappedField, arguments) :
                this._valid;
        },
        
        /**
         * Значение поля
         * @return {*}
         */
        getValue: function() {
            return this._wrappedField ?
                this._transformValue(this._wrappedField.getValue.apply(this._wrappedField, arguments), false) :
                this._options.value;
        },
        
        /**
         * Считать ли поле (либо переданное значение) пустым
         * @param {*} [value=null]
         * @returns {boolean}
         */
        isEmpty: function(value) {
            return this._wrappedField ? this._wrappedField.isEmpty.apply(this._wrappedField, arguments) :
                croc.ui.form.validation.MStandardValidatable.prototype.isEmpty.call(this, value);
        },
        
        /**
         * Поле в начальном, пустом состоянии
         * @returns {boolean}
         */
        isEmptyState: function() {
            return this._wrappedField ? this._wrappedField.isEmptyState.apply(this._wrappedField, arguments) :
                croc.ui.form.field.MStandardField.prototype.isEmptyState.call(this);
        },
        
        /**
         * Изменить состояние валидности поля
         * @param {boolean|null} valid
         */
        setValid: function(valid) {
            this._wrappedField.setValid.apply(this._wrappedField, arguments);
            this._valid = valid;
        },
        
        /**
         * Изменить значение поля
         * @param {*} value
         * @param [internal]
         */
        setValue: function(value, internal) {
            if (this._wrappedField) {
                this._wrappedField.setValue(this._transformValue(value, true), internal);
            }
            this._options.value = value;
        },
        
        /**
         * Добавляет опции, которыми необходимо расширять конструируемый wrappedField
         * @param {...string} args
         * @protected
         */
        _addExtendingWrapperOptions: function(args) {
            this.__extendingWrapperOptions = this.__extendingWrapperOptions.concat(_.toArray(arguments));
        },
        
        /**
         * Расширить объект необходимыми конфигурационными свойствами (применяется для создания wrappedField)
         * @param {Object} target
         * @protected
         */
        _extendWithWrapperOptions: function(target) {
            var options = this._options;
            
            this.__extendingWrapperOptions.forEach(function(option) {
                if (options[option] !== null && options[option] !== undefined) {
                    target[option] = option !== 'value' ? options[option] :
                        this._transformValue(options[option], true);
                }
            }, this);
            
            if (options._wrappedConf) {
                _.assign(target, options._wrappedConf);
            }
            
            return target;
        },
        
        /**
         * Текстовое поле
         * @returns {croc.ui.form.field.IField}
         * @protected
         * @deprecated use _wrappedField
         */
        _getWrappedField: function() {
            return this._wrappedField;
        },
        
        /**
         * Добавляет опции, которыми необходимо расширять конструируемый wrappedField
         * @param {...string} args
         * @protected
         */
        _removeExtendingWrapperOptions: function(args) {
            this.__extendingWrapperOptions = _.difference(this.__extendingWrapperOptions, _.toArray(arguments));
        },
        
        /**
         * Трансформирует значение поля в значение враппера (direct=false) и наоборот
         * @param value
         * @param {boolean} direct
         * @returns {*}
         * @protected
         */
        _transformValue: function(value, direct) {
            return value;
        },
        
        /**
         * Метод вызывается при добавлении нового дочернего элемента
         * @param {string} section
         * @param {croc.ui.Widget} item
         * @protected
         */
        _onAddItem: function(section, item) {
            if (section === 'wrappedField') {
                this._wrappedField = item;
                
                if (this._options._wrapSection) {
                    this._wrappedField.on('validClassChanged', function() {
                        this.fireEvent.apply(this, ['validClassChanged'].concat(_.toArray(arguments)));
                    }, this);
                }
                
                if (this.__proxyChangeValueEvent) {
                    this._wrappedField.on('changeValue', function(value, oldValue) {
                        this.fireEvent('changeValue',
                            this._transformValue(value, false),
                            this._transformValue(oldValue, false));
                    }, this);
                }
            }
        }
    }
});