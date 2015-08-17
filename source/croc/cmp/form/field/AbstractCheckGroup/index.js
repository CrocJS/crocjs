/**
 * api-ru Группа чекбоксов/радиокнопок
 * api-en Group of checkboxes/radiobuttons
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
         * api-ru Должны ли кнопки идти в ряд. true - соответствует dir_ttb, false - dir_ltr
         * api-en Do buttons need to line up? True - match to dir_ttb, false - dir_ltr
         * @type {boolean}
         */
        inline: {},
        
        /**
         * api-ru мета-данные для добавления дочернего виджета
         * api-en Metadata for adding a child widget.
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
         * api-ru тип группы
         * api-en Group type.
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
         * api-ru Возвращает true если кнопки выстроены в линию
         * api-en Returns true if buttons are lined up.
         * @returns {boolean}
         */
        isInline: function() {
            return this._options.inline;
        },
        
        /**
         * api-ru Изменение значения группы
         * api-en Changing of group value.
         * @param value
         * @protected
         */
        _doSetValue: function(value) {
            throw 'abstract!';
        },
        
        /**
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
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
