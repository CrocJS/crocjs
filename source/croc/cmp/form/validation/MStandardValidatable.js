/**
 * Реализация стандартных методов валидации
 * todo назначать класс valid/error после создания виджета
 */
croc.Mixin.define('croc.cmp.form.validation.MStandardValidatable', {
    statics: {
        classByValid: function(valid) {
            return valid ? ' state_valid' : valid === false ? ' state_error' : '';
        }
    },
    
    events: {
        /**
         * Класс state_valid/state_error был изменён
         * @param {boolean} valid
         */
        validClassChanged: null
    },
    
    properties: {
        valid: {
            value: null,
            model: true
        }
    },
    
    options: {
        /**
         * Сообщение об ошибке валидации
         * @type {string}
         */
        invalidMessage: null,
        
        /**
         * см. {@link #getValidation}
         * @type {function|object|string}
         */
        validation: null,
        
        valid_throttled: null,
        
        /**
         * Сообщения об ошибках валидации (validatorId => message)
         * @type {Object.<string, string>}
         */
        validationMessages: {
            value: {},
            extend: true
        },
        
        /**
         * Таймаут перед назначением классов state_valid/state_error
         * @type {number}
         */
        _changeValidClassTimeout: null
    },
    
    preConstruct: function(options) {
        if (options._changeValidClassTimeout && croc.isClient) {
            this.__standardValidatableSetClass = _.debounce(
                this.disposableFunc(this.__standardValidatableSetClass),
                options._changeValidClassTimeout
            );
        }
        
        this.listenProperty('valid', function() {
            this.__standardValidatableSetClass();
        }, this);
    },
    
    members: {
        /**
         * Сообщение об ошибке
         * @returns {String}
         */
        getInvalidMessage: function() {
            return this._options.invalidMessage;
        },
        
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @returns {string|Array}
         */
        getPlainValue: function() {
            return this.getValue();
        },
        
        /**
         * Правила валидации поля (заданные в виде объекта или json), либо функция валидации (бросает
         * {@link croc.cmp.form.validation.Error} при ошибке валидации)
         * @returns {function(*, croc.cmp.form.validation.IValidatable, Object.<string, croc.cmp.form.validation.IValidatable>)|object|string}
         */
        getValidation: function() {
            return this._options.validation;
        },
        
        /**
         * Сообщения об ошибках валидации (validatorId => message)
         * @returns {Object.<string, string>}
         */
        getValidationMessages: function() {
            return this._options.validationMessages || {};
        },
        
        /**
         * Считать ли поле (либо переданное значение) пустым
         * @param {*} [value=null]
         * @returns {boolean}
         */
        isEmpty: function(value) {
            value = value === undefined ? this.getPlainValue() : value;
            return value !== 0 && !value;
        },
        
        /**
         * Поле в начальном, пустом состоянии
         * @returns {boolean}
         */
        isEmptyState: function() {
            return this.isEmpty();
        },
        
        /**
         * Задать сообщение об ошибке
         * @param {string} message
         */
        setInvalidMessage: function(message) {
            this._options.invalidMessage = message;
        },
        
        /**
         * Обработать смену состояния валидации поля
         * @param {boolean} valid
         * @protected
         */
        _onValidClassChanged: function(valid) {},
        
        /**
         * @private
         */
        __standardValidatableSetClass: function() {
            this._model.set('valid_throttled', this._options.valid);
            this._onValidClassChanged(this._options.valid);
            this.fireEvent('validClassChanged', this._options.valid);
        }
    }
});
