/**
 * @param {string} message
 * @param {string} [validatorId=undefined] строковый идентификатор правила валидации
 */
croc.define('croc.ui.form.validation.Error', function(message, validatorId) {
    this.message = message;
    this.name = 'ValidationError';
    this.__validatorId = validatorId;
});

croc.Class.inherit(croc.ui.form.validation.Error, Error);

croc.ui.form.validation.Error.prototype = {
    constructor: croc.ui.form.validation.Error,
    
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
};
