/**
 * Менеджер виджетов
 */
croc.Class.define('croc.ui.WidgetsManager', {
    extend: croc.Object,
    
    statics: {
        /**
         * @returns {croc.ui.WidgetsManager}
         * @static
         */
        getInstance: function() {
            return this.__instance || (this.__instance = new croc.ui.WidgetsManager());
        },
        
        /**
         * Возвращает глобальный виджет текущей страницы
         * @returns {croc.ui.Widget}
         */
        getPageWidget: function() {
            return this.getInstance().getPageWidget();
        }
    },
    
    events: {
        /**
         * @param {croc.Object} component
         */
        visualComponentRegistered: null,
        
        /**
         * @param {croc.ui.Widget} widget
         */
        widgetRegistered: null,
        
        /**
         * @param {croc.ui.Widget} widget
         */
        widgetUnregistered: null
    },
    
    construct: function(options) {
        this.__types = {};
        this.__typeToXtype = {};
        this.__widgets = {};
        
        croc.ui.WidgetsManager.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * Возвращает глобальный виджет текущей страницы
         * @returns {croc.ui.Widget}
         */
        getPageWidget: function() {
            return this.__pageWidget && !this.__pageWidget.isDisposed() ? this.__pageWidget :
                (this.__pageWidget = new croc.ui.Container({el: $(document.body)}));
        },
        
        /**
         * Возвращает тип виждета по его имени. Если виджет не зарегистрирован, то бросает ошибку.
         * @param {string|Function} xtype
         * @returns {function}
         * @static
         */
        getWidgetType: function(xtype) {
            if (typeof xtype === 'function') {
                return xtype;
            }
            
            var widget = this.__types[xtype];
            if (!widget) {
                throw new Error('Запрошен незарегистрированный тип виджета по xtype "' + xtype + '"');
            }
            return widget;
        },
        
        /**
         * Возвращает все виджеты зарегистрированные в данный момент
         * @returns {Array.<croc.ui.Widget>}
         */
        getWidgets: function() {
            return _.values(this.__widgets);
        },
        
        /**
         * Получить xtype по типу виджета
         * @param {Function} type
         * @returns {string}
         * @static
         */
        getXType: function(type) {
            return type.classname || this.__typeToXtype[croc.utils.objUniqueId(type)];
        },
        
        /**
         * регистрация типа виджета по его имени
         * @param {function} type
         * @param {string} xtype
         * @static
         */
        registerAlias: function(type, xtype) {
            this.__types[xtype] = type;
            this.__typeToXtype[croc.utils.objUniqueId(type)] = xtype;
        },
        
        /**
         * Регистрация визуального компонента (временный костыль, пока не все компоненты являются виджетами)
         * @param {croc.Object} component
         */
        registerVisualComponent: function(component) {
            this.fireEvent('visualComponentRegistered', component);
        },
        
        /**
         * Регистрация виджета при его инициализации
         * @param {croc.ui.Widget} widget
         */
        registerWidget: function(widget) {
            this.__widgets[widget.getUniqueId()] = widget;
            this.fireEvent('widgetRegistered', widget);
        },
        
        /**
         * Прекращение регистрации виджета
         * @param {croc.ui.Widget} widget
         */
        unregisterWidget: function(widget) {
            delete this.__widgets[widget.getUniqueId()];
            this.fireEvent('widgetUnregistered', widget);
        }
    }
});
