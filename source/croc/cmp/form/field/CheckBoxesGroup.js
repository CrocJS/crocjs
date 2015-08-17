/**
 * api-ru Группа радиокнопок
 * api-en Group of radiobuttons.
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
         * api-ru У дочерних чекбоксов одинаковые имена и значением поля является массив с их значениями (value)
         * api-en Child checkboxes have the same names and field value is an array with their values.
         * @type {boolean}
         */
        arrayValues: {},
        
        /**
         * api-ru Примешивает значения чекбоксов к значениям формы если arrayValues=false
         * api-en Export checkboxes values to form values if arrayValues=false.
         * @type {boolean}
         */
        exportsValues: true,
        
        /**
         * api-ru Следует ли группировать чекбоксы в массивы по одинаковому идентификатору
         * api-en Does checkboxes needs to be grouped in arrays according to same ID?
         * @type {boolean}
         */
        groupCheckboxes: {},
        
        /**
         * api-ru Удалять неотмеченные чекбоксы из значения
         * api-en Remove unchecked checkboxes out of values.
         * @type {boolean}
         */
        removeUnchecked: true,
        
        /**
         * api-ru тип группы
         * api-en Group type.
         * @type {string}
         */
        type: 'checkbox',
        
        /**
         * api-ru Сообщения об ошибках валидации (validatorId => message)
         * api-en Messages of valodation errors (validatorId => message).
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
         * api-ru Если возвращает объект, то он примешивается к значениям формы
         * api-en If returns the object, then it exports to form values.
         * @returns {Object}
         */
        exportValues: function() {
            return this._options.arrayValues || !this._options.exportsValues ? null : this.getValue() || {};
        },
        
        /**
         * api-ru Считать ли поле (либо переданное значение) пустым
         * api-en Is field (or sent value) empty? 
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
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
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
                        if (this.getValue().indexOf(item.getPermanentValue()) !== -1) {
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
         * api-ru Изменение значения группы
         * api-en Changing of group value.
         * @param value
         * @param old
         * @param passed
         * @protected
         */
        _doSetValue: function(value, old, passed) {
            if (passed && passed.checkGroupInternal) {
                return;
            }
            value = value || (this._options.arrayValues ? [] : {});
            this.getItems().forEach(function(item) {
                if (this._options.arrayValues) {
                    item.setValue(value.indexOf(item.getPermanentValue()) !== -1, passed);
                }
                else {
                    var val = value[item.getIdentifier() || item.getParentIndex()];
                    item.setValue(
                        !!val && (!this._options.groupCheckboxes || val.indexOf(item.getPermanentValue()) !== -1),
                        passed);
                }
            }, this);
        },
        
        /**
         * @private
         */
        __onChangeItemValue: function(value, old, passed) {
            if (passed && passed.checkGroupInternal) {
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
            this.setValue(newValue, {checkGroupInternal: true});
        }
    }
});
