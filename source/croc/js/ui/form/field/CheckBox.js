/**
 * Чекбокс
 */
croc.Class.define('croc.ui.form.field.CheckBox', {
    extend: croc.ui.form.field.AbstractCheckButton,
    
    options: {
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<label class="b-input-checkbox {stateChecked}{cls}">' +
        '   <input type="checkbox" name="{name}" value="{permanentValue}" {checked}{tabIndex}><span class="b-input-checkbox-h"></span>' +
        '</label>',
        
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
         * Html-элемент поля
         * @return {jQuery}
         */
        getFieldElement: function() {
            return this.__fieldElement ||
                (this.getElement() && (this.__fieldElement = this.getElement().find('input[type=checkbox]')));
        }
    }
});
