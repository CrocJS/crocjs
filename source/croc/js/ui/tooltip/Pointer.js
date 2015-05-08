/**
 * Тултип b-sbutton
 */
croc.Class.define('croc.ui.tooltip.Pointer', {
    extend: croc.ui.tooltip.Tooltip,
    
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
            cssClass: true,
            type: 'string',
            value: '1',
            option: true
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
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<div class="b-sbutton type_image set_tooltip mod_system{cls}">' +
        '<div class="b-sbutton-before" style="display: none"></div>' +
        '<div class="b-sbutton-h">{items}</div>' +
        '<div class="b-sbutton-after" style="display: none"></div>' +
        '</div>',
        
        /**
         * Новый дизайн тултипов
         * @type {boolean}
         */
        newDesign: false,
        
        /**
         * Анимация всплывания
         * @type {string}
         */
        showAnimation: 'fly',
        
        /**
         * Css-стили корневого элемента виджета
         * @type {Object}
         */
        style: {
            value: {
                position: 'absolute'
            }
        },
        
        /**
         * Расстояние от края bubble до соответствующего края target
         * @type {number}
         */
        sourceDistance: 0
    },
    
    members: {
        /**
         * Элемент, содержащий контент тултипа
         * @returns {jQuery}
         */
        getBodyElement: function() {
            return this.getElement().find('.b-sbutton-h');
        },
        
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