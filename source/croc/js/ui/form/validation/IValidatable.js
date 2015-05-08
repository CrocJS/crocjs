/**
 * Поле подлежащее валидации
 */
croc.Interface.define('croc.ui.form.validation.IValidatable', {
    extend: croc.IObject,
    
    members: {
        /**
         * Получить DOM-элемент виджета
         * @returns {jQuery}
         */
        getElement: function() {},
        
        /**
         * Сообщение об ошибке
         * @return {string}
         */
        getInvalidMessage: function() {},
        
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @type {string|Array}
         */
        getPlainValue: function() {},
        
        /**
         * Находится ли поле в валидном состоянии
         * @return {boolean|null}
         */
        getValid: function() {},
        
        /**
         * Правила валидации поля (заданные в виде объекта или json), либо функция валидации (бросает
         * {@link croc.ui.form.validation.Error} при ошибке валидации)
         * @return {function(*, croc.ui.form.validation.IValidatable, Object.<string, croc.ui.form.validation.IValidatable>)|object|string}
         */
        getValidation: function() {},
        
        /**
         * Сообщения об ошибках валидации (validatorId => message)
         * @returns {Object.<string, string>}
         */
        getValidationMessages: function() {},
        
        /**
         * Значение поля
         * @return {*}
         */
        getValue: function() {},
        
        /**
         * Считать ли поле (либо переданное значение) пустым
         * @param {*} [value=null]
         * @returns {boolean}
         */
        isEmpty: function(value) {},
        
        /**
         * Поле в начальном, пустом состоянии
         * @returns {boolean}
         */
        isEmptyState: function() {},
        
        /**
         * Задать сообщение об ошибке
         * @param {string} message
         */
        setInvalidMessage: function(message) {},
        
        /**
         * Изменить состояние валидности поля
         * @param {boolean|null} valid
         */
        setValid: function(valid) {}
    }
});
