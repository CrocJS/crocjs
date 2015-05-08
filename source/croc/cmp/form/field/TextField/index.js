/**
 * Абстракция над полем ввода
 */
croc.Class.define('croc.cmp.form.field.TextField', {
    extend: croc.cmp.Widget,
    
    properties: {
        action: {
            check: ['loader', 'unfold'],
            model: true
        },
        
        /**
         * @type {boolean}
         */
        focused: {
            type: 'boolean',
            model: true
        },
        
        /**
         * Мгновенное значение текстового поля
         * @type {string}
         */
        instantValue: {
            type: 'string',
            model: true
        },
        
        /**
         * плэйсхолдер для поля
         * @type {string}
         */
        placeholder: {
            type: 'string',
            model: true
        },
        
        /**
         * Размер поля
         * @type {string}
         */
        size: {
            type: 'string',
            __setter: null,
            value: '1',
            model: true
        },
        
        /**
         * @type {string}
         */
        value: {
            value: '',
            __setter: null,
            model: true
        }
    },
    
    options: {},
    
    members: {
        blur: function() {
            this.setFocused(false);
        },
        
        focus: function() {
            this.setFocused(true);
        },
        
        /**
         * @returns {jQuery}
         */
        getFieldElement: function() {
            return this._options._fieldElement;
        },
        
        select: function() {
            this._model.increment('selectField');
        },
        
        setValue: function(value) {
            if (value === this.getValue()) {
                this.setInstantValue(value);
            }
            else {
                this.__setValue(value);
            }
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.TextField.superclass._initModel.apply(this, arguments);
            if (this.getInstantValue()) {
                this.setValue(this.getInstantValue());
            }
            croc.data.Helper.bind(this, 'value', this._model, 'instantValue');
        }
    }
});
