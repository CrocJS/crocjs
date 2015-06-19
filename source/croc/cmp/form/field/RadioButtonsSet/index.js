/**
 * Переключаемый набор кнопок
 */
croc.Class.define('croc.cmp.form.field.RadioButtonsSet', {
    extend: croc.cmp.Widget,
    include: croc.cmp.form.field.MStandardField,
    implement: [
        croc.cmp.form.field.IField,
        croc.cmp.form.field.ISizable,
        croc.cmp.form.field.IDisable
    ],
    
    properties: {
        /**
         * Блокировка поля
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
        },
        
        /**
         * Размер поля
         * @type {string}
         */
        size: {
            type: 'string',
            value: '1',
            model: true
        },
        
        value: {
            __setter: null,
            model: true
        }
    },
    
    options: {
        buttons: {},
        
        /**
         * Повторное нажатие на зажатую кнопку приводит к обнулению свитчера
         * @type {boolean}
         */
        nullable: {}
    },
    
    members: {
        /**
         * Возвращает индекс активной кнопки
         * @returns {number}
         */
        getActiveButtonIndex: function() {
            return !this.getValue() ? -1 : _.findIndex(this.getItems(), function(x) {return x.getActive();});
        },
        
        setValue: function(value, passed) {
            this.__setValue(passed && passed.toggle && this._options.nullable && this._options.value === value ? null : value);
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.RadioButtonsSet.superclass._initModel.apply(this, arguments);
            if (!this._options.value) {
                var button = _.find(this._options.buttons, function(x) { return x.checked; });
                if (button) {
                    this.setValue(button.value);
                }
            }
        }
    }
});