/**
 * todo Сделать стандартные иконки
 */
croc.Class.define('croc.ui.map.Helper', {
    type: 'static',
    statics: {
        DEFAULT_ICON: {
            href: '//img2.sotmarket.ru/delivery/placemarks/sotmarket.png',
            size: [31, 31],
            offset: [-15, -31]
        },
        
        ICONS: {
            house: 'house'
        },
        
        ICONS_MAP: {
            gmaps: {
                house: 'http://maps.google.com/mapfiles/ms/icons/homegardenbusiness.png'
            },
            ymaps: {
                house: 'twirl#houseIcon'
            }
        },
        
        /**
         * Объединяет прямоугольник с точкой
         * @param {Array.<Array.<number>>} bounds
         * @param {Array.<number>} point
         * @returns {Array.<Array.<number>>}
         */
        addPointToBounds: function(bounds, point) {
            if (!bounds) {
                return [point, point];
            }
            return [
                [Math.min(bounds[0][0], point[0]), Math.min(bounds[0][1], point[1])],
                [Math.max(bounds[1][0], point[0]), Math.max(bounds[1][1], point[1])]
            ];
        },
        
        /**
         * @param {Array.<Array.<number>>} bounds
         * @returns {Array.<number>}
         */
        getBoundsCenter: function(bounds) {
            return [bounds[0][0] + (bounds[1][0] - bounds[0][0]) / 2, bounds[0][1] + (bounds[1][1] - bounds[0][1]) / 2];
        },
        
        /**
         * @param {Array.<Array.<number>>} points
         * @returns {Array.<Array.<number>>}
         */
        getBoundsForPoints: function(points) {
            return points.reduce(function(bounds, point) {
                return croc.ui.map.Helper.addPointToBounds(bounds, point);
            }, null);
        },
        
        /**
         * @param {string} brand
         * @returns {Object}
         */
        getIconByBrand: function(brand) {
            return {
                href: '//img2.sotmarket.ru/delivery/placemarks/' + brand + '.png',
                size: [37, 42],
                offset: [-11, -40]
            };
        },
        
        /**
         * Объединяет два прямоугольника в один
         * @param {Array.<Array.<number>>} a
         * @param {Array.<Array.<number>>} b
         * @returns {Array.<Array.<number>>}
         */
        mergeBounds: function(a, b) {
            if (!b) {
                return a;
            }
            if (!a) {
                return b;
            }
            return [
                [Math.max(a[0][0], b[0][0]), Math.max(a[0][1], b[0][1])],
                [Math.min(a[1][0], b[1][0]), Math.min(a[1][1], b[1][1])]
            ];
        }
    }
});
