/**
 * api-ru Группа радиокнопок
 * api-en Group of radiobuttons.
 */
croc.Class.define('croc.cmp.form.field.RadioButtonsGroup', {
    extend: croc.cmp.form.field.AbstractCheckGroup,
    
    options: {
        /**
         * api-ru Отметить первую кнопку в группе, если ни одна не отмечена
         * api-en Check first button in group, if no one is checked.
         * @type {boolean}
         */
        checkFirst: {},
        
        /**
         * api-ru тип группы
         * api-en Group type.
         * @type {string}
         */
        type: 'radio',
        
        /**
         * api-ru Сообщения об ошибках валидации (validatorId => message)
         * api-en Validation error messages (validatorId => message).
         * @type {Object.<string, string>}
         */
        validationMessages: {
            required: 'Выберите значение'
        }
    },
    
    members: {
        /**
         * Class of children items
         * @returns {Function}
         */
        getItemClass: function() {
            return croc.cmp.form.field.RadioButton;
        },
        
        /**
         * api-ru Отмечает первую неотключённую кнопку
         * api-en Check first enabled button.
         */
        checkFirstButton: function() {
            _.forEach(this.getItems(), function(button) {
                if (!button.getDisabled()) {
                    button.setChecked(true);
                    return false;
                }
            });
        },
        
        /**
         * api-ru Если возвращает объект, то он примешивается к значениям формы
         * api-en If returns the object, then it exports to form values.
         * @returns {Object}
         */
        exportValues: function() {
            return null;
        },
        
        /**
         * api-ru Возвращает отмеченную радиокнопку
         * api-en Returns checked radiobutton.
         * @returns {croc.cmp.form.field.RadioButton}
         */
        getCheckedButton: function() {
            return this.getValue() && this.getItemByValue(this.getValue());
        },
        
        /**
         * api-ru Возвращает радиокнопку из группы по её значению
         * api-en Returns radiobutton from group by its value.
         * @param {string} value
         * @returns {croc.cmp.form.field.RadioButton}
         */
        getItemByValue: function(value) {
            return _.find(this.getItems(), function(x) { return x.getPermanentValue() === value; }) || null;
        },
        
        /**
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.RadioButtonsGroup.superclass._initModel.apply(this, arguments);
            
            var checkFirst = !this.getValue() && this._options.checkFirst;
            this.on('initChild', function(item) {
                item._model.set('identifier', this.getIdentifier());
                
                if (checkFirst && !item.getDisabled()) {
                    item.setValue(true);
                    checkFirst = false;
                }
                
                if (this.getValue()) {
                    item.setValue(item.getPermanentValue() === this.getValue());
                }
                else if (item.getValue()) {
                    this.setValue(item.getPermanentValue());
                }
                
                item.on('changeValue', function(value, old, passed) {
                    if (value && (!passed || !passed.radioGroupInternal)) {
                        this.setValue(item.getPermanentValue());
                    }
                }, this);
            }, this);
        },
        
        /**
         * api-ru Изменение значения группы
         * api-en Changing of group value.
         * @param value
         * @protected
         */
        _doSetValue: function(value) {
            this.getItems().forEach(function(item) {
                item.setValue(item.getPermanentValue() == value, {radioGroupInternal: true}); // jshint ignore:line
            });
        }
    }
});
