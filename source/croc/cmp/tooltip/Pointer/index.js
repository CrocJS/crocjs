/**
 * Тултип b-sbutton
 */
croc.Class.define('croc.cmp.tooltip.Pointer', {
    extend: croc.cmp.tooltip.Tooltip,
    
    properties: {
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            inherit: true,
            check: ['left', 'right'],
            value: 'right'
        },
        
        /**
         * Цветовая схема тултипа
         * @type {string}
         */
        scheme: {
            inherit: true,
            check: ['red', 'yellow', 'blue'],
            value: 'yellow'
        },
        
        /**
         * Размер тултипа
         */
        size: {
            type: 'string',
            value: '1',
            model: true
        }
    },
    
    options: {
        /**
         * Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * @type {Array}
         */
        autoPositioningSequence: ['left', 'right'],
        
        /**
         * Можно ли смещать элемент
         * @type {boolean}
         */
        autoShift: false,
        
        /**
         * Анимация всплывания
         * @type {string}
         */
        showAnimation: 'fly',
        
        /**
         * Расстояние от края bubble до соответствующего края target
         * @type {number}
         */
        sourceDistance: 0
    },
    
    members: {
        /**
         * Возвращает элемент точки крепления. Например, стрелка тултипа.
         * @returns {jQuery}
         * @protected
         */
        _getJointEl: function() {
            return null;
        }
    }
});