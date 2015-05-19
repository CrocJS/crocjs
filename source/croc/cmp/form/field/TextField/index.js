/**
 * Абстракция над полем ввода
 */
croc.Class.define('croc.cmp.form.field.TextField', {
    extend: croc.cmp.form.field.AbstractTextField,
    
    properties: {
        action: {
            check: ['loader', 'unfold'],
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
