croc.ns('croc.ui.form.field');

/**
 * Группа чекбоксов
 * @extends {croc.ui.form.field.AbstractCheckGroup}
 */
croc.ui.form.field.CheckBoxesGroup = croc.extend(croc.ui.form.field.AbstractCheckGroup, {
    
    /**
     * У дочерних чекбоксов одинаковые имена и значением поля является массив с их значениями (value)
     * @type {boolean}
     */
    arrayValues: false,
    
    /**
     * Примешивает значения чекбоксов к значениям формы если arrayValues=false
     * @type {boolean}
     */
    exportsValues: true,
    
    /**
     * Следует ли группировать чекбоксы в массивы по одинаковому идентификатору
     * @type {boolean}
     */
    groupCheckboxes: false,
    
    /**
     * Конфигурация по-умолчанию добавляемая к items
     * @type {Object.<string, object>|object}
     */
    itemDefaults: {
        items: {
            xtype: croc.ui.form.field.CheckBox
        }
    },
    
    /**
     * Удалять неотмеченные кнопки из значения
     * @type {boolean}
     */
    removeUnchecked: true,
    
    /**
     * тип группы
     * @type {string}
     */
    type: 'checkbox',
    
    /**
     * Сообщения об ошибках валидации (validatorId => message)
     * @type {Object.<string, string>}
     */
    validationMessages: {
        required: 'Отметьте необходимые флажки'
    },
    
    /**
     * значение поля (замещает текущее значение поля, если передано)
     * @type {Object}
     */
    value: null,
    
    /**
     * Если возвращает объект, то он примешивается к значениям формы
     * @returns {Object}
     */
    exportValues: function() {
        return this.arrayValues || !this.exportsValues ? null : this.getValue() || {};
    },
    
    /**
     * Считать ли поле (либо переданное значение) пустым
     * @param {*} [value=null]
     * @returns {boolean}
     */
    isEmpty: function(value) {
        if (value === undefined) {
            value = this.getValue();
        }
        if (!value) {
            return true;
        }
        if (Array.isArray(value)) {
            return value.length === 0;
        }
        return Object.keys(value).every(function(x) { return !value[x]; });
    },
    
    /**
     * Изменить значение поля
     * @param {*} value
     */
    setValue: function(value) {
        if (value) {
            if (this.arrayValues) {
                if (!value.length) {
                    value = null;
                }
            }
            else {
                var newValue = {};
                _.forOwn(value, function(val, key) {
                    if (this.groupCheckboxes ? val.length > 0 : !this.removeUnchecked || val) {
                        newValue[key] = val;
                    }
                }, this);
                
                value = Object.keys(newValue).length > 0 ? newValue : null;
            }
        }
        
        croc.ui.form.field.CheckBoxesGroup.superclass.setValue.call(this, value);
    },
    
    /**
     * Изменение значения группы
     * @param value
     * @protected
     */
    _doSetValue: function(value) {
        value = value || (this.arrayValues ? [] : {});
        this.getItems().forEach(function(item) {
            if (this.arrayValues) {
                item.setChecked(value.indexOf(item.getPermanentValue()) !== -1);
            }
            else {
                var val = value[item.getIdentifier() || item.getParentIndex()];
                item.setChecked(!!val && (!this.groupCheckboxes || val.indexOf(item.getPermanentValue()) !== -1));
            }
        }, this);
    },
    
    /**
     * Изменение значения группы
     * @returns {string}
     * @protected
     */
    _getButtonClass: function() {
        return 'b-input-checkbox';
    },
    
    /**
     * Возвращает конфигурация виджета по его элементу. Конфигурация как минимум должна содержать xtype.
     * @param {string} section
     * @param {jQuery} element
     * @return {object}
     * @protected
     */
    _getConfByElement: function(section, element) {
        return {xtype: croc.ui.form.field.CheckBox};
    },
    
    /**
     * Метод вызывается при добавлении нового дочернего элемента
     * @param {string} section
     * @param {croc.ui.Widget} item
     * @protected
     */
    _onAddItem: function(section, item) {
        croc.ui.form.field.CheckBoxesGroup.superclass._onAddItem.apply(this, arguments);
        
        if (section !== 'items') {
            return;
        }
        
        var checkbox = /** @type {croc.ui.form.field.CheckBox} */(item);
        
        if (this.getValue() && !checkbox.getChecked()) {
            if (this.arrayValues) {
                if (this.getValue().indexOf(checkbox.getIdentifier()) !== -1) {
                    checkbox.setChecked(true);
                }
            }
            else {
                var val = this.getValue()[checkbox.getIdentifier() || checkbox.getParentIndex()];
                if (this.groupCheckboxes ? val.indexOf(checkbox.getPermanentValue()) !== -1 : val) {
                    checkbox.setChecked(true);
                }
            }
        }
        
        checkbox.on('changeValue', this.__onChangeItemValue, this);
        this.__onChangeItemValue();
    },
    
    /**
     * @private
     */
    __onChangeItemValue: function() {
        if (this.__dontHandleChangeValue) {
            return;
        }
        var newValue;
        if (this.arrayValues) {
            newValue = this.getItems()
                .filter(function(x) { return x.getChecked(); })
                .map(function(x) { return x.getPermanentValue(); });
            if (!newValue.length) {
                newValue = null;
            }
        }
        else {
            newValue = {};
            this.getItems().forEach(function(item, index) {
                var id = item.getIdentifier() || index;
                if (!this.groupCheckboxes) {
                    if (!this.removeUnchecked || item.getChecked()) {
                        newValue[id] = item.getChecked();
                    }
                }
                else if (item.getChecked()) {
                    (newValue[id] || (newValue[id] = [])).push(item.getPermanentValue());
                }
            }, this);
            if (!Object.keys(newValue).length) {
                newValue = null;
            }
        }
        this.__dontHandleChangeValue = true;
        if (this.getRendered()) {
            this.setValue(newValue);
        }
        else {
            this._setValueInternal(newValue);
        }
        this.__dontHandleChangeValue = false;
    }
});
croc.ui.WidgetsManager.getInstance().registerAlias(croc.ui.form.field.CheckBoxesGroup,
    'croc.ui.form.field.CheckBoxesGroup');
