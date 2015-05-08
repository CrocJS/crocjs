croc.ns('croc.ui.form.validation');

/**
 * Ошибка валидации
 * @extends {Error}
 */
croc.ui.form.validation.Error = croc.extend(Error, {
    /**
     * @param {string} message
     * @param {string} [validatorId=undefined] строковый идентификатор правила валидации
     */
    constructor: function(message, validatorId) {
        this.message = message;
        this.name = 'ValidationError';
        this.__validatorId = validatorId;
    },
    
    /**
     * строковый идентификатор правила валидации
     * @returns {string}
     */
    getValidatorId: function() {
        return this.__validatorId;
    },
    
    /**
     * строковый идентификатор правила валидации
     * @param {string} validatorId
     */
    setValidatorId: function(validatorId) {
        this.__validatorId = validatorId;
    }
});
