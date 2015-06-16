/**
 * Обёртка для поля
 */
croc.Class.define('croc.cmp.form.field.AbstractFieldWrapper', {
    type: 'abstract',
    extend: croc.cmp.Widget,
    implement: croc.cmp.form.field.IField,
    include: croc.cmp.form.field.MStandardField,
    
    properties: {
        value: {
            model: true
        }
    },
    
    //options: {
    //    /**
    //     * проксировать ли событие changeValue
    //     * @type {boolean}
    //     */
    //    _proxyChangeValueEvent: true
    //},
    
    construct: function() {
        this.__extendingWrapperOptions = ['value', 'identifier', 'valid'];
        croc.cmp.form.field.AbstractFieldWrapper.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Если возвращает объект, то он примешивается к значениям формы
         * @returns {Object}
         */
        exportValues: function() {
            return this._wrapped.exportValues();
        },
        
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @type {string|Array}
         */
        getPlainValue: function() {
            return !this._wrapped ? this._options.value :
                this._wrapped.getPlainValue.apply(this._wrapped, arguments);
        },
        
        /**
         * Считать ли поле (либо переданное значение) пустым
         * @param {*} [value=null]
         * @returns {boolean}
         */
        isEmpty: function(value) {
            return this._wrapped ? this._wrapped.isEmpty.apply(this._wrapped, arguments) :
                croc.cmp.form.validation.MStandardValidatable.prototype.isEmpty.call(this, value);
        },
        
        /**
         * Поле в начальном, пустом состоянии
         * @returns {boolean}
         */
        isEmptyState: function() {
            return this._wrapped ? this._wrapped.isEmptyState.apply(this._wrapped, arguments) :
                croc.cmp.form.field.MStandardField.prototype.isEmptyState.call(this);
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
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.AbstractFieldWrapper.superclass._initModel.apply(this, arguments);
            
            this.__extendingWrapperOptions.forEach(function(option) {
                var value = this._options[option];
                if (option === 'value') {
                    value = this._transformValue(value, true);
                }
                this._options.ddefaults[option] = value;
            }, this);
            
            this.onWrapped(function(item) {
                this.__extendingWrapperOptions.forEach(function(option) {
                    if (option === 'value') {
                        croc.Object.twoWaysBinding(item, 'value', this, 'value',
                            function(x) {
                                //noinspection JSPotentiallyInvalidUsageOfThis
                                return this._transformValue(x, false);
                            },
                            function(x) { return this._transformValue(x, true); }, this);
                    }
                    else {
                        item._model.ref(option, this._model.at(option));
                    }
                }, this);
                
                item.on('validClassChanged', function() {
                    this.fireEvent.apply(this, ['validClassChanged'].concat(_.toArray(arguments)));
                }, this);
            }, this);
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
        }
    }
});