/**
 * api-ru Базовый класс для всех виджетов, которые имеют привязку к одному единственному элементу
 * api-en Base class for all widgets that associated with one single element.
 */
croc.Interface.define('croc.cmp.IWidget', {
    extend: croc.IObject,
    
    events: {
        /**
         * A child widget was added
         * @param {croc.cmp.Widget} widget
         */
        addChild: null,
        
        appear: null,
        
        create: null,
        destroy: null,
        init: null,
        
        /**
         * @param model
         */
        model: null,
        
        /**
         * A child widget was removed
         * @param {croc.cmp.Widget} widget
         */
        removeChild: null,
        
        /**
         * @param {string} reason
         */
        resize: null
    },
    
    properties: {
        detachParent: {},
        
        /**
         * @type {string}
         */
        mod: {},
        
        /**
         * @type {boolean}
         */
        rendered: {
            getter: null
        },
        
        /**
         * @type {boolean}
         */
        shown: {}
    },
    
    members: {
        /**
         * api-ru Всплывающий ресайз компонента
         * api-en Bubble component’s resizing
         */
        bubbleResize: function() {},
        
        /**
         * api-ru Уведомить виджет о том, что размеры рамок изменились
         * api-ru Причины вызова метода: reposition, modelChange, render, parentResize, bubbleResize, auto
         * api-en Notify the widget that frames sizes were changed
         * api-en Cases of access method: reposition, modelChange, render, parentResize, bubbleResize, auto.
         * @param {string} [reason]
         * @returns {boolean}
         */
        checkResize: function(reason) {},
        
        /**
         * Generate unique id which can be used in templates
         * todo move to service
         */
        generateUniqueId: function(prefix, context) {},
        
        /**
         * api-ru Секция дочерних элементов по-умолчанию
         * api-en Default child elements section.
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {},
        
        /**
         * api-ru Получить DOM-элемент виджета
         * aoi-en Get widget DOM-element.
         * @returns {jQuery}
         */
        getElement: function() {},
        
        /**
         * api-ru Идентификатор виджета
         * api-en Widget ID
         * @returns {string}
         */
        getIdentifier: function() {},
        
        /**
         * api-ru Получить дочерний виджет по его идентификатору
         * api-en Get child widget by its ID
         * @param {string} identifier
         * @returns {croc.cmp.Widget}
         */
        getItem: function(identifier) {
            return this.__itemsHash[identifier];
        },
        
        /**
         * api-ru Получить все дочерние виджеты
         * api-en Get all child widgets
         * @param {string} [section=null]
         * @returns {Array.<croc.cmp.Widget>}
         */
        getItems: function(section) {},
        
        /**
         * api-ru Родительский виджет
         * api-en Parent widget 
         * @return {croc.cmp.Widget}
         */
        getParent: function() {},
        
        /**
         * @returns {string}
         */
        getSection: function() {},
        
        /**
         * Get element which is contained by the widget element
         * @param {string} id
         * @returns {jQuery}
         */
        getSubElement: function(id) {},
        
        /**
         * Get selector for the subelement
         * @param {string} id
         * @returns {string}
         */
        getSubElementSelector: function(id) {},
        
        /**
         * Get value of parent context expression with passed alias
         */
        getValueByAlias: function(alias) {},
        
        /**
         * api-ru Враппер виджета. Если нет то возвращает корневой элемент виджета.
         * api-en Wrapper widget. If there is none, then it returns root widget’s element.
         * @returns {jQuery}
         */
        getWrapperElement: function() {},
        
        innerResize: function() {},
        
        /**
         * api-ru Виден ли в данный момент виджет
         * api-en If widget is visible at the moment.
         * @returns {boolean}
         */
        isVisible: function() { },
        
        /**
         * api-ru Если элемент виден, то callback вызывается сразу иначе на событие appear
         * api-en If element is visible, then callback is called, otherwise it returns to event appear. 
         * @param {function} callback
         * @param {Object} [context]
         * @returns {Function}
         */
        onAppear: function(callback, context) {},
        
        resolveVirtualView: function(name) {},
        
        /**
         * Css class for subelement
         * @param {string} id
         * @returns {string}
         */
        subElement: function(id) {}
    }
});