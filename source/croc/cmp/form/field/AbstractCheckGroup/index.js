/**
 * Группа чекбоксов/радиокнопок
 */
croc.Class.define('croc.cmp.form.field.AbstractCheckGroup', {
    type: 'abstract',
    extend: croc.cmp.Widget,
    
    implement: [
        croc.cmp.form.field.IField,
        croc.cmp.form.field.ISizable,
        croc.cmp.form.field.IDisable
    ],
    
    include: croc.cmp.form.field.MStandardField,
    
    properties: {
        /**
         * Is field disabled
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
        },
        
        value: {
            model: true
        }
    },
    
    options: {
        items: {},
        
        /**
         * Должны ли кнопки идти в ряд. true - соответствует dir_ttb, false - dir_ltr
         * @type {boolean}
         */
        inline: {},
        
        /**
         * мета-данные для добавления дочернего виджета
         * @type {object}
         */
        meta: {
            openTooltipAnyway: true
        },
        
        /**
         * Field size
         * @type {string}
         */
        size: {
            check: ['1', '2', '3', '4', '5'],
            value: '1'
        },
        
        /**
         * тип группы
         * @type {string}
         */
        type: {}
    },
    
    members: {
        /**
         * Class of children items
         * @returns {Function}
         */
        getItemClass: function() {
            throw 'abstract!';
        },
        
        /**
         * Field size
         * @returns {string}
         */
        getSize: function() {
            return this._options.size;
        },
        
        /**
         * Возвращает true если кнопки выстроены в линию
         * @returns {boolean}
         */
        isInline: function() {
            return this._options.inline;
        },
        
        /**
         * Изменение значения группы
         * @param value
         * @protected
         */
        _doSetValue: function(value) {
            throw 'abstract!';
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.AbstractCheckGroup.superclass._initModel.apply(this, arguments);
            this._options.checkChild = _.assign({}, this._options.checkChild, {
                items: this.getItemClass()
            });
            this.on('initChild', function(item) {
                item._model.set('size', this.getSize());
            });
            this.on('changeValue', this._doSetValue, this);
        }
    }
});
