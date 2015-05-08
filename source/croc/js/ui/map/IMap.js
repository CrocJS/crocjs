/**
 * Виджет карты
 */
croc.Interface.define('croc.ui.map.IMap', {
    extend: croc.ui.IWidget,
    
    events: {
        /**
         * Geo object was clicked
         * @param {Object} geoObject
         */
        geoObjectClick: null
    },
    
    properties: {
        /**
         * Ограничивающий прямоугольник видимой области карты ([[x1, y1], [x2, y2]])
         * @type {Array.<Array<number>>}
         */
        bounds: {
            event: true
        },
        
        /**
         * Центр карты ([x1, x2])
         * @type {Array.<number>}
         */
        center: {
            event: true
        },
        
        /**
         * Объект с открытым балуном
         * @type {croc.ui.map.GeoObject}
         */
        openedBalloon: {
            event: true
        },
        
        /**
         * Зум карты
         * @type {number}
         */
        zoom: {
            event: true
        }
    },
    
    members: {
        /**
         * Возобновить рендеринг объектов
         */
        flush: function() {},
        
        /**
         * Массив объектов на карте {@link croc.ui.map.GeoObject}
         * @returns {croc.data.ObservableArray}
         */
        getGeoObjects: function() {},
        
        /**
         * Перерисовка карты
         */
        redraw: function() {},
        
        /**
         * Приостановить рендеринг объектов
         */
        stopRendering: function() {},
        
        /**
         * Update balloon size for geo object
         */
        updateBalloon: function(object) {}
    }
});

//noinspection JSHint
/**
 * type = 'polygon'|'placemark'
 * Для polygon: points, fill, stroke
 * Для placemark: address, icon, center
 * balloon, hint - для обоих типов
 * @typedef {{
 *  type: String,
 *  [address]: String,
 *  [icon]: String | {
 *      href: String,
 *      [size]: Array.<number>,
 *      [offset]: Array.<number>
 *  },
 *  [center]: Array.<number>,
 *  [points]: Array.<Array.<number>>, 
 *  [fill]: {
 *      [color]: String,
 *      [opacity]: number
 *  }, 
 *  [stroke]: {
 *      [color]: String, 
 *      [opacity]: number, 
 *      [width]: number
 *  },
 *  [balloon]: {
 *      content: String|function(Object):(string|croc.ui.Widget),
 *      [opened]: boolean
 *  },
 *  [hint]: String
 * }}
 */
croc.ui.map.GeoObject;