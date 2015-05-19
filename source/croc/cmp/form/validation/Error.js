/**
 * Ошибка валидации
 */
croc.Class.define('croc.cmp.form.validation.Error', {
    type: 'native',
    extend: Error,
    
    /**
     * @param {string} message
     * @param {string} [validatorId=undefined] строковый идентификатор правила валидации
     */
    construct: function(message, validatorId) {
        this.message = message;
        this.name = 'ValidationError';
        this.__validatorId = validatorId;
    },
    
    members: {
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
    }
});
