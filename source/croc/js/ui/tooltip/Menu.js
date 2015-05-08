/**
 * Меню с вариантами
 */
croc.Class.define('croc.ui.tooltip.Menu', {
    extend: croc.ui.tooltip.Links,
    
    properties: {
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            inherit: true,
            check: ['top', 'bottom'],
            value: 'bottom'
        }
    },
    
    options: {
        /**
         * Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * @type {Array|Object}
         */
        autoPositioningSequence: ['top', 'bottom'],
        
        /**
         * Можно ли смещать элемент
         * @type {boolean}
         */
        autoShift: false,
        
        /**
         * Кнопка, к которой следует привязать меню
         * @type {croc.ui.form.Button}
         */
        button: {
            type: 'croc.ui.form.Button'
        },
        
        /**
         * Дополнительные классы для блока через пробел
         * @type {string}
         */
        extraCls: 'set_menu',
        
        /**
         * Смещение по горизонтали относительно центра цели
         * @type {string}
         */
        hAlign: 'left',
        
        /**
         * Модификатор блока (css класс mod_...)
         * @type {string}
         */
        mod: 'callback',
        
        /**
         * Вид списка (модификатор view_...)
         * @type {string}
         */
        listView: 'block',
        
        /**
         * Тип ссылок в списке
         * @type {boolean}
         */
        linksType: 'block',
        
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number}
         */
        offset: 2,
        
        /**
         * Расстояние от края bubble до соответствующего края target
         * @type {number}
         */
        sourceDistance: 0,
        
        /**
         * Опции триггеринга (событий показа/сокрытия) тултипа
         * @type {Object}
         */
        triggerOptions: {
            value: croc.ui.tooltip.Tooltip.TRIGGER_CLICK
        }
    },
    
    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.tooltip.Menu.superclass._initWidget.apply(this, arguments);
            
            if (this.__button) {
                this.bind('open', this.__button, 'active');
                this._getDisposer().addBinding(this.__button, 'disabled', this, 'disabled');
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__button = options.button;
            if (this.__button) {
                this.setTarget(this.__button);
                options.extraCls =
                    (options.extraCls ? options.extraCls + ' ' : '') + ' size_' + this.__button.getSize();
            }
            
            croc.ui.tooltip.Menu.superclass._onPropertiesInitialized.apply(this, arguments);
        }
    }
});