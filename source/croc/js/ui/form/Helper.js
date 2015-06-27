croc.ns('croc.ui.form');

croc.ui.form.Helper = {
    /**
     * возвращает/генерирует dom id для внутреннего элемента поля
     * @param {croc.ui.form.field.IHtmlControl} field
     * @param {string} [preferredId]
     * @return {string}
     */
    getFieldId: function(field, preferredId) {
        var store = croc.utils.objUserData(this, field);
        if (!store.fieldId) {
            if (field.getRendered()) {
                var el = field.getFieldElement().eq(0);
                store.fieldId = el.attr('id');
                if (!store.fieldId) {
                    el.attr('id', store.fieldId = (preferredId || croc.utils.getStmId()));
                }
            }
            else {
                store.fieldId = (preferredId || croc.utils.getStmId());
                field.once('changeRendered', function() {
                    var el = field.getFieldElement().eq(0);
                    el.attr('id', store.fieldId);
                });
            }
        }
        
        return store.fieldId;
    },
    
    /**
     * Генерирует id для поля
     * @param {croc.ui.form.field.IHtmlControl} field
     * @param {string} id
     */
    setFieldId: function(field, id) {
        this.getFieldId(field, id);
    },
    
    /**
     * @param {croc.ui.form.field.ComboBox} dayField
     * @param {croc.ui.form.field.IField} monthField
     * @param {croc.ui.form.field.IField} yearField
     */
    setUpDayField: function(dayField, monthField, yearField) {
        croc.Object.listenProperties(
            monthField, 'value',
            yearField, 'value',
            function() {
                var daysInMonth = new Date(
                    yearField.getPlainValue() || (new Date().getFullYear()),
                    monthField.getPlainValue() || 0, 0).getDate();
                
                var days = [];
                for (var i = daysInMonth + 1; i <= 31; ++i) {
                    var day = croc.utils.strPad(i.toString(), 2, '0');
                    days.push({text: day, value: day});
                }
                dayField.setExcludes(days);
            });
        
        var blurTimeout;
        dayField.on({
            blur: function() {
                blurTimeout = setTimeout(function() {
                    if (dayField.getPlainValue()) {
                        dayField.setValue(croc.utils.strPad(dayField.getPlainValue(), 2, '0'));
                    }
                }, 50);
            },
            focus: function() {
                clearTimeout(blurTimeout);
            }
        });
    },
    
    /**
     * Создаёт/инициализирует примеры для поля (поле должно принадлежать форме)
     * @param {croc.ui.form.field.ITextField} field
     * @param {Array.<string>} [examples]
     */
    setUpExamplesForField: function(field, examples) {
        if (examples) {
            var examplesStr = examples.map(function(x) {
                return '<span class="g-link b-pseudolink js-example-link"><span class="b-pseudolink-h">' + x + '</span></span>';
            }).join(' или ');
            field.getParentWidget().setFieldHint(field, 'Например, ' + examplesStr);
        }
        
        croc.ui.form.Form.getFieldWrapper(field).find('.js-example-link').click(function() {
            field.setValue($(this).text());
            field.focus();
        });
    }
    
};