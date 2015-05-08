croc.ns('croc.ui.form.field');

/**
 * Группа радиокнопок
 * @extends {croc.ui.form.field.AbstractCheckGroup}
 */
croc.ui.form.field.RadioButtonsGroup = croc.extend(croc.ui.form.field.AbstractCheckGroup, {
    
    /**
     * Конфигурация по-умолчанию добавляемая к items
     * @type {Object.<string, object>|object}
     */
    itemDefaults: {
        items: {
            xtype: croc.ui.form.field.RadioButton
        }
    },
    
    /**
     * тип группы
     * @type {string}
     */
    type: 'radio',
    
    /**
     * Сообщения об ошибках валидации (validatorId => message)
     * @type {Object.<string, string>}
     */
    validationMessages: {
        required: 'Выберите значение'
    },
    
    /**
     * значение поля (замещает текущее значение поля, если передано)
     * @type {string}
     */
    value: null,
    
    /**
     * Отмечает первую неотключённую кнопку
     */
    checkFirstButton: function() {
        for (var i = 0, button; (button = this.getItems()[i++]);) {
            if (!button.getDisabled()) {
                button.setChecked(true);
                return;
            }
        }
    },
    
    /**
     * Если возвращает объект, то он примешивается к значениям формы
     * @returns {Object}
     */
    exportValues: function() {
        return null;
    },
    
    /**
     * Возвращает огтмеченную радиокнопку
     * @returns {croc.ui.form.field.RadioButton}
     */
    getCheckedButton: function() {
        //noinspection JSHint
        return this.getValue() != null && this.getItemByValue(this.getValue());
    },
    
    /**
     * Возвращает радиокнопку из группы по её значению
     * @param {string} value
     * @returns {croc.ui.form.field.RadioButton}
     */
    getItemByValue: function(value) {
        for (var i = 0, button; (button = this.getItems()[i++]);) {
            //noinspection JSHint
            if (button.getPermanentValue() == value) {
                return button;
            }
        }
        return null;
    },
    
    /**
     * Изменение значения группы
     * @param value
     * @protected
     */
    _doSetValue: function(value) {
        this.getItems().forEach(function(item) {
            var field = /** @type {croc.ui.form.field.RadioButton} */(item);
            //noinspection JSHint
            field.setChecked(field.getPermanentValue() == value);
        });
    },
    
    /**
     * Изменение значения группы
     * @returns {string}
     * @protected
     */
    _getButtonClass: function() {
        return 'b-input-radio';
    },
    
    /**
     * Возвращает конфигурация виджета по его элементу. Конфигурация как минимум должна содержать xtype.
     * @param {string} section
     * @param {jQuery} element
     * @return {object}
     * @protected
     */
    _getConfByElement: function(section, element) {
        return {xtype: croc.ui.form.field.RadioButton, identifier: this.getIdentifier()};
    },
    
    /**
     * Метод вызывается при добавлении нового дочернего элемента
     * @param {string} section
     * @param {croc.ui.Widget} item
     * @protected
     */
    _onAddItem: function(section, item) {
        croc.ui.form.field.RadioButtonsGroup.superclass._onAddItem.apply(this, arguments);
        
        if (section !== 'items') {
            return;
        }
        
        var field = /** @type {croc.ui.form.field.RadioButton} */(item);
        
        if (field.getChecked()) {
            this.setValue(field.getPermanentValue());
        }
        else { //noinspection JSHint
            if (this.getValue() == field.getPermanentValue()) {
                field.setChecked(true);
            }
        }
        
        field.on('changeValue', function() {
            if (field.getChecked()) {
                this.setValue(field.getPermanentValue());
            }
        }, this);
    },
    
    /**
     * Выполняется когда свойства виджета уже инициализированы
     * @protected
     */
    _onPropertiesInitialized: function() {
        croc.ui.form.field.RadioButtonsGroup.superclass._onPropertiesInitialized.apply(this, arguments);
        
        if (!this.identifier && this.getElement()) {
            var input = this.getElement().find('input');
            if (input.length && input.attr('name')) {
                this.identifier = input.attr('name');
            }
        }
        
        if (!this.identifier) {
            this.identifier = croc.utils.getStmId();
        }
        
        this.itemDefaults.items.identifier = this.identifier;
    }
});

croc.ui.WidgetsManager.getInstance().registerAlias(croc.ui.form.field.RadioButtonsGroup,
    'croc.ui.form.field.RadioButtonsGroup');
