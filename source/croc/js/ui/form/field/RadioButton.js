/**
 * Радиокнопка
 */
croc.Class.define('croc.ui.form.field.RadioButton', {
    extend: croc.ui.form.field.AbstractCheckButton,
    
    options: {
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<label class="b-input-radio {stateChecked}{cls}">' +
        '   <input type="radio" name="{name}" value="{permanentValue}" {checked}{tabIndex}><span class="b-input-radio-h"></span>' +
        '</label>'
    },
    
    members: {
        /**
         * Html-элемент поля
         * @return {jQuery}
         */
        getFieldElement: function() {
            return this.__fieldElement ||
                (this.getElement() && (this.__fieldElement = this.getElement().find('input[type=radio]')));
        }
    }

//    /**
//     * Изменяет значение поля
//     * @param value
//     * @protected
//     */
//    _doSetValue: function(value) {
//        //радиобаттон не вызывает change когда нажимается другой радиобаттон
//        var sameValue = this.getValue() === value;
//        croc.ui.form.field.RadioButton.superclass._doSetValue.call(this, value);
//        if (sameValue) {
//            this.fireEvent('changeValue', value, this.getOppositeValue());
//            this.fireEvent('changeChecked', this.getChecked(), !this.getChecked());
//        }
//    },
});
