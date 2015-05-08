/**
 * Попап для отображения карты
 */
croc.Class.define('croc.ui.popup.Map', {
    extend: croc.ui.popup.Popup,
    
    options: {
        /**
         * Конфигурация для компонента {@link croc.ui.map.MultiMap}
         * @type {Object}
         */
        mapConfig: {},
        
        /**
         * Модификатор блока (css класс mod_...)
         * @type {string}
         */
        mod: 'map',
        
        /**
         * Отбрасывает ли попап тень
         * @type {boolean}
         */
        shadow: false,
        
        /**
         * @type {number}
         */
        width: 530
    },
    
    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.popup.Map.superclass._initWidget.apply(this, arguments);
            
            var map = new croc.ui.map.MultiMap(croc.Object.mergeConf({
                renderTo: this.getBodyElement(),
                style: {
                    height: '100%'
                }
            }, this.__mapConfig));
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__mapConfig = options.mapConfig;
            croc.ui.popup.Map.superclass._onPropertiesInitialized.apply(this, arguments);
        }
    }
});