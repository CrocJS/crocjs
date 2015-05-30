/**
 * Группа радиокнопок
 */
croc.Class.define('croc.cmp.form.field.CheckBoxesGroup', {
    extend: croc.cmp.form.field.AbstractCheckGroup,
    
    properties: {
        value: {
            inherit: true,
            transform: function(value) {
                if (value) {
                    if (this._options.arrayValues) {
                        if (!value.length) {
                            value = null;
                        }
                    }
                    else {
                        var newValue = {};
                        _.forOwn(value, function(val, key) {
                            if (this._options.groupCheckboxes ? val.length > 0 : !this._options.removeUnchecked || val) {
                                newValue[key] = val;
                            }
                        }, this);
                        
                        value = Object.keys(newValue).length > 0 ? newValue : null;
                    }
                }
                return value;
            }
        }
    },
    
    options: {
        /**
         * У дочерних чекбоксов одинаковые имена и значением поля является массив с их значениями (value)
         * @type {boolean}
         */
        arrayValues: {},
        
        /**
         * Примешивает значения чекбоксов к значениям формы если arrayValues=false
         * @type {boolean}
         */
        exportsValues: true,
        
        /**
         * Следует ли группировать чекбоксы в массивы по одинаковому идентификатору
         * @type {boolean}
         */
        groupCheckboxes: {},
        
        /**
         * Удалять неотмеченные чекбоксы из значения
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
            required: 'Отметьте хотя бы один флажок'
        }
    },
    
    members: {
        /**
         * Class of children items
         * @returns {Function}
         */
        getItemClass: function() {
            return croc.cmp.form.field.CheckBox;
        },
        
        /**
         * Если возвращает объект, то он примешивается к значениям формы
         * @returns {Object}
         */
        exportValues: function() {
            return this._options.arrayValues || !this._options.exportsValues ? null : this.getValue() || {};
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
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.RadioButtonsGroup.superclass._initModel.apply(this, arguments);
            
            this.on('initChild', function(item) {
                if (this._options.arrayValues && !item._passedOptions.identifier) {
                    item._model.set('identifier', this.getIdentifier());
                }
                if (this.getValue() && !item.getValue()) {
                    if (this._options.arrayValues) {
                        if (this.getValue().indexOf(item.getIdentifier()) !== -1) {
                            item.setValue(true);
                        }
                    }
                    else {
                        var val = this.getValue()[item.getIdentifier() || item.getParentIndex()];
                        if (this._options.groupCheckboxes ? val.indexOf(item.getPermanentValue()) !== -1 : val) {
                            item.setValue(true);
                        }
                    }
                }
    
                item.on('changeValue', this.__onChangeItemValue, this);
                this.__onChangeItemValue();
            }, this);
        },
        
        /**
         * Изменение значения группы
         * @param value
         * @protected
         */
        _doSetValue: function(value) {
            value = value || (this._options.arrayValues ? [] : {});
            this.getItems().forEach(function(item) {
                if (this._options.arrayValues) {
                    item.setValue(value.indexOf(item.getPermanentValue()) !== -1);
                }
                else {
                    var val = value[item.getIdentifier() || item.getParentIndex()];
                    item.setValue(
                        !!val && (!this._options.groupCheckboxes || val.indexOf(item.getPermanentValue()) !== -1));
                }
            }, this);
        },
    
        /**
         * @private
         */
        __onChangeItemValue: function() {
            if (this.__dontHandleChangeValue) {
                return;
            }
            var newValue;
            if (this._options.arrayValues) {
                newValue = this.getItems()
                    .filter(function(x) { return x.getValue(); })
                    .map(function(x) { return x.getPermanentValue(); });
                if (!newValue.length) {
                    newValue = null;
                }
            }
            else {
                newValue = {};
                this.getItems().forEach(function(item, index) {
                    var id = item.getIdentifier() || index;
                    if (!this._options.groupCheckboxes) {
                        if (!this._options.removeUnchecked || item.getValue()) {
                            newValue[id] = item.getValue();
                        }
                    }
                    else if (item.getValue()) {
                        (newValue[id] || (newValue[id] = [])).push(item.getPermanentValue());
                    }
                }, this);
                if (!Object.keys(newValue).length) {
                    newValue = null;
                }
            }
            this.__dontHandleChangeValue = true;
            this.setValue(newValue);
            this.__dontHandleChangeValue = false;
        }
    }
});
