/**
 * Базовый класс для всех виджетов, которые имеют привязку к одному единственному элементу
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
         * Всплывающий ресайз компонента
         */
        bubbleResize: function() {},
        
        /**
         * Уведомить виджет о том, что размеры рамок изменились
         * Причины вызова метода: reposition, modelChange, render, parentResize, bubbleResize, auto
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
         * Секция дочерних элементов по-умолчанию
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {},
        
        /**
         * Получить DOM-элемент виджета
         * @returns {jQuery}
         */
        getElement: function() {},
        
        /**
         * Идентификатор виджета
         * @returns {string}
         */
        getIdentifier: function() {},
        
        /**
         * Получить дочерний виджет по его идентификатору
         * @param {string} identifier
         * @returns {croc.cmp.Widget}
         */
        getItem: function(identifier) {
            return this.__itemsHash[identifier];
        },
        
        /**
         * Получить все дочерние виджеты
         * @param {string} [section=null]
         * @returns {Array.<croc.cmp.Widget>}
         */
        getItems: function(section) {},
        
        /**
         * Родительский виджет
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
         * Враппер виджета. Если нет то возвращает корневой элемент виджета.
         * @returns {jQuery}
         */
        getWrapperElement: function() {},
        
        innerResize: function() {},
        
        /**
         * Виден ли в данный момент виджет
         * @returns {boolean}
         */
        isVisible: function() { },
        
        /**
         * Если элемент виден, то callback вызывается сразу иначе на событие appear
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