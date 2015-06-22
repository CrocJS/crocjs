/**
 * Группа радиокнопок
 */
croc.Class.define('croc.cmp.form.field.RadioButtonsGroup', {
    extend: croc.cmp.form.field.AbstractCheckGroup,
    
    options: {
        /**
         * Отметить первую кнопку в группе, если ни одна не отмечена
         * @type {boolean}
         */
        checkFirst: {},
        
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
         * Отмечает первую неотключённую кнопку
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
         * Если возвращает объект, то он примешивается к значениям формы
         * @returns {Object}
         */
        exportValues: function() {
            return null;
        },
        
        /**
         * Возвращает отмеченную радиокнопку
         * @returns {croc.cmp.form.field.RadioButton}
         */
        getCheckedButton: function() {
            return this.getValue() && this.getItemByValue(this.getValue());
        },
        
        /**
         * Возвращает радиокнопку из группы по её значению
         * @param {string} value
         * @returns {croc.cmp.form.field.RadioButton}
         */
        getItemByValue: function(value) {
            return _.find(this.getItems(), function(x) { return x.getPermanentValue() === value; }) || null;
        },
        
        /**
         * Инициализация модели виджета
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
         * Изменение значения группы
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
