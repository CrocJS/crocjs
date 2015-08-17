//+use b-input-checkbox

/**
 * Checkbox
 */
croc.Class.define('croc.cmp.form.field.CheckBox', {
    extend: croc.cmp.form.field.AbstractCheckButton,
    
    options: {
        /**
         * api-ru Сообщения об ошибках валидации (validatorId => message)
         * api-en Validation error messages (validatorId => message).
         * @type {Object.<string, string>}
         */
        validationMessages: {
            value: {
                required: 'Флажок должен быть отмечен'
                // api-ru
                // required: api-en 'Flag should be marked'
            }
        }
    },
    
    members: {
        /**
         * type of check button
         * @returns {string}
         */
        getButtonType: function() {
            return 'checkbox';
        }
    }
});
