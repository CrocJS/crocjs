/**
 * Базовый интерфейс для всех виджетов, которые имеют привязку к одному единственному элементу
 */
croc.Interface.define('croc.ui.IWidget', {
    extend: croc.IObject,
    
    events: {
        /**
         * @deprecated
         */
        render: null
    },
    
    properties: {
        /**
         * @type {string}
         */
        mod: {
            type: 'string'
        },
        
        /**
         * @type {boolean}
         */
        rendered: {
            getter: null,
            event: true
        },
        
        /**
         * @type {boolean}
         */
        shown: {
            type: 'boolean',
            event: true
        }
    },
    
    members: {
        /**
         * Полное разрушение виджета
         */
        destroy: function() {},
        
        /**
         * Получить DOM-элемент виджета
         * @returns {jQuery}
         */
        getElement: function() {},
        
        /**
         * Получить/сгенерировать dom id элемента
         * @return {string}
         */
        getId: function() {},
        
        /**
         * Идентификатор виджета
         * @returns {string}
         */
        getIdentifier: function() {},
        
        /**
         * Мета-данные виджета
         * @returns {Object}
         */
        getMeta: function() {},
        
        /**
         * Возвращает индекс виджета у родителя
         * @returns {number}
         */
        getParentIndex: function() {},
        
        /**
         * Родительская секция
         * @return {string}
         */
        getParentSection: function() {},
        
        /**
         * Родительский виджет
         * @return {croc.ui.Widget}
         */
        getParentWidget: function() {},
        
        /**
         * @type {string}
         */
        getWidth: function() {},
        
        /**
         * Была ли разметка виджета сгенерирована
         * @returns {boolean}
         */
        isHtmlGenerated: function() {},
        
        /**
         * Изменить ширину виджета
         * @type {number|string}
         */
        setWidth: function(width) {}
    }
});