//+use b-input-checkbox

/**
 * Checkbox
 */
croc.Class.define('croc.cmp.form.field.CheckBox', {
    extend: croc.cmp.form.field.AbstractCheckButton,
    
    options: {
        /**
         * Сообщения об ошибках валидации (validatorId => message)
         * @type {Object.<string, string>}
         */
        validationMessages: {
            value: {
                required: 'Флажок должен быть отмечен'
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
