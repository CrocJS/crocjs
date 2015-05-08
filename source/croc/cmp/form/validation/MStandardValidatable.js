croc.ns('croc.ui.form.validation');

/**
 * Реализация стандартных методов валидации
 * todo назначать класс valid/error после создания виджета
 */
croc.Mixin.define('croc.ui.form.validation.MStandardValidatable', {
    events: {
        /**
         * Класс state_valid/state_error был изменён
         * @param {boolean} valid
         */
        validClassChanged: null
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
        _changeValidClassTimeout: null,
        
        _valid: null
    },
    
    preConstruct: function(options) {
        if (options._changeValidClassTimeout) {
            this.__standardValidatableValidTimeout = _.debounce(
                this.disposableFunc(this.__standardValidatableSetClass),
                options._changeValidClassTimeout
            );
        }
    },
    
    construct: function(options) {
        this.__valid = options._valid;
    },
    
    members: {
        /**
         * Сообщение об ошибке
         * @return {String}
         */
        getInvalidMessage: function() {
            return this._options.invalidMessage;
        },
        
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @type {string|Array}
         */
        getPlainValue: function() {
            return this.getValue();
        },
        
        /**
         * Находится ли поле в валидном состоянии
         * @return {boolean|null}
         */
        getValid: function() {
            return this.__valid;
        },
        
        /**
         * Правила валидации поля (заданные в виде объекта или json), либо функция валидации (бросает
         * {@link croc.ui.form.validation.Error} при ошибке валидации)
         * @return {function(*, croc.ui.form.validation.IValidatable, Object.<string, croc.ui.form.validation.IValidatable>)|object|string}
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
         * Изменить состояние валидности поля
         * @param {boolean|null} valid
         */
        setValid: function(valid) {
            this.__valid = valid;
            this.__standardValidatableSetClass();
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
            if (this.getElement()) {
                this.getElement()
                    .toggleClass('state_valid', this.__valid === true)
                    .toggleClass('state_error', this.__valid === false);
            }
            this._onValidClassChanged(this.__valid);
            this.fireEvent('validClassChanged', this.__valid);
        }
    }
});
