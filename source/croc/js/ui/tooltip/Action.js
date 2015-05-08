/**
 */
croc.Class.define('croc.ui.tooltip.Action', {
    extend: croc.ui.tooltip.Links,
    
    properties: {
        /**
         * Цветовая схема тултипа
         * @type {string}
         */
        scheme: {
            inherit: true,
            check: ['blue'],
            value: 'blue'
        }
    },
    
    options: {
        /**
         * Можно ли смещать элемент
         * @type {boolean}
         */
        autoShift: false,
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<div class="b-tooltip-complex{cls}">' +
        '   <div class="b-tooltip-complex-tri"></div>' +
        '   {items}' +
        '</div>',
        
        /**
         * @type {boolean}
         */
        linksType: 'block',
        
        /**
         * @type {string}
         */
        listItemTemplate: '<div class="b-tooltip-complex-item{cls}">{content}</div>',
        
        /**
         * @type {string}
         */
        listViewTemplate: '<div class="b-tooltip-complex-list{cls}">{items}</div>',
        
        /**
         * Новый дизайн тултипов
         * @type {boolean}
         */
        newDesign: false,
        
        /**
         * Расстояние от края bubble до соответствующего края target
         * @type {number}
         */
        sourceDistance: 15,
        
        /**
         * Дополнительные классы для корневого элемента
         * @type {Array.<string>}
         */
        _addClasses: ['size_1']
    },
    
    members: {
        /**
         * Возвращает элемент точки крепления. Например, стрелка тултипа.
         * @returns {jQuery}
         * @protected
         */
        _getJointEl: function() {
            return this.__jointEl || (this.__jointEl = $('.b-tooltip-complex-tri'));
        }
    }
});