/**
 * Всплывающий элемент
 */
croc.Interface.define('croc.ui.common.bubble.IBubble', {
    extend: croc.ui.IWidget,
    
    properties: {
        /**
         * Смещение по горизонтали относительно центра цели
         * @type {string}
         */
        hAlign: {
            check: ['left', 'centerLeft', 'center', 'centerRight', 'right']
        },
        
        /**
         * Обновлять позицию по таймауту
         * @type {boolean}
         */
        keepActualPosition: {
            type: 'boolean'
        },
        
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number}
         */
        offset: {
            type: ['number', 'array']
        },
        
        /**
         * Открыт ли в данный момент тултип
         * @type {boolean}
         */
        open: {
            type: 'boolean'
        },
        
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            check: ['top', 'bottom', 'left', 'right', 'center']
        },
        
        /**
         * Объект крепления bubble. Может быть коллекцией dom-элементов, виджетом, точкой на экране (массив [x, y]),
         * прямоугольником (массив [[x1, y1], [x2, y2]]), функция - которая возвращает значение одного из предыдущих
         * типов
         * @type {jQuery|croc.ui.Widget|Array|function}
         */
        target: {},
        
        /**
         * Смещение по вертикали относительно центра цели
         * @type {string}
         */
        vAlign: {
            check: ['top', 'middleTop', 'middle', 'middleBottom', 'bottom']
        }
    },
    
    members: {
        /**
         * Скрыть bubble
         * @param {boolean} [quick=false] закрыть без анимации
         */
        close: function(quick) {},
        
        /**
         * Закрыть bubble по прошествию указанного промежутка времени
         * @param {number} timeout
         */
        closeIn: function(timeout) {},
        
        /**
         * Возвращает текущую позицию тултипа (совпадает с #getPosition() если автопозиционирование отключено)
         * @returns {string}
         */
        getCurrentPosition: function() {},
        
        /**
         * Возвращает элемент, на котором в данный момент был открыт bubble
         * @returns {jQuery|Array}
         */
        getCurrentTarget: function() {},
        
        /**
         * Слой, на котором лежит bubble
         * @returns {string}
         */
        getZIndexLayer: function() {},
        
        /**
         * Показать bubble. Если тултип был открыт, то возвращает true.
         * @returns {boolean}
         */
        open: function() {},
        
        /**
         * Пересчитать позицию
         */
        reposition: function() {},
        
        /**
         * Прекратить отсчёт времени до закрытия bubble
         */
        stopCloseTimeout: function() {}
    }
});
