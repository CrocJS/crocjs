/**
 * Виджет карты Yandex Map
 */
croc.Class.define('croc.ui.map.YandexMap', {
    extend: croc.ui.map.AbstractMap,
    
    options: {
        /**
         * @type {string}
         */
        mod: 'yandex'
    },
    
    members: {
        /**
         * Имя сервиса карт
         * @returns {string}
         */
        getServiceName: function() {
            return 'yandex';
        },
        
        /**
         * Перерисовка карты
         */
        redraw: function() {
            croc.ui.map.YandexMap.superclass.redraw.apply(this, arguments);
            if (this.__map) {
                this.__map.container.fitToViewport();
                if (this.getOpenedBalloon()) {
                    this.updateBalloon(this.getOpenedBalloon());
                }
            }
            
            if (this.__restoreBalloon && this.getOpenedBalloon() === this.__restoreBalloon) {
                var store = croc.utils.objUserData(this, this.__restoreBalloon);
                store.balloon.close();
                store.balloon.open();
            }
            this.__restoreBalloon = null;
        },
        
        /**
         * Update balloon size for geo object
         */
        updateBalloon: function(object) {
            if (this.getOpenedBalloon() === object && this.__map) {
                this.getUserData(object).balloon.open();
                this.__updateBalloonContent(object);
            }
        },
        
        /**
         * Добавить на карту объект
         * @param {croc.ui.map.GeoObject} object
         * @protected
         */
        _addGeoObject: function(object) {
            var properties = {};
            var options = {};
            var store = croc.utils.objUserData(this, object);
            if (!store.geoObjectInited || !store.geoObject) {
                
                if (object.balloon) {
                    properties.balloonContent = this._getBalloonContent(object);
                }
                if (object.hint) {
                    properties.hintContent = object.hint;
                }
                
                if (typeof object.icon === 'string') {
                    options.preset = croc.ui.map.Helper.ICONS_MAP.ymaps[object.icon];
                }
                else if (object.icon) {
                    options.iconImageHref = object.icon.href;
                    options.iconImageOffset = object.icon.offset;
                    options.iconImageSize = object.icon.size;
                }
                
                if (object.type === 'polygon') {
                    if (object.fill) {
                        if (object.fill.color) {
                            options.fillColor = object.fill.color + 'FF';
                        }
                        if (object.fill.opacity) {
                            options.fillOpacity = object.fill.opacity;
                        }
                    }
                    if (object.stroke) {
                        if (object.stroke.color) {
                            options.strokeColor = object.stroke.color + 'FF';
                        }
                        if (object.stroke.opacity) {
                            options.strokeOpacity = object.stroke.opacity;
                        }
                        if (object.stroke.width) {
                            options.strokeWidth = object.stroke.width;
                        }
                    }
                }
            }
            
            var init = function() {
                if (object.balloon) {
                    store.balloon = store.geoObject.balloon;
                    
                    store.balloon.events.add('open', function(e) {
                        store.balloonCmp = e.get('balloon');
                        this.__initBalloonElement(object);
                        
                        this.setOpenedBalloon(object, true);
                    }.bind(this));
                    store.balloon.events.add('close', function() {
                        this.setOpenedBalloon(null, true);
                    }.bind(this));
                    
                    var oldUpdate = object.balloon.update;
                    object.balloon.update = function() {
                        if (oldUpdate) {
                            oldUpdate.call(this);
                        }
                        if (typeof object.balloon.content === 'function') {
                            properties.balloonContent = this._getBalloonContent(object);
                            store.geoObject.properties.set(properties);
                            
                            if (store.balloon.isOpen()) {
                                if (!this.getElement().is(':visible')) {
                                    this.__restoreBalloon = object;
                                }
                                this.__initBalloonElement(object);
                            }
                        }
                    }.bind(this);
                }
                
                store.geoObject.events.add('click', function() {
                    this.fireEvent('geoObjectClick', object);
                }.bind(this));
            }.bind(this);
            
            if (!store.geoObject) {
                store.geoObject = object.type === 'polygon' ?
                    new ymaps.Polygon([object.points], properties, options) :
                    new ymaps.Placemark(object.center, properties, options);
                init();
                store.geoObjectInited = true;
            }
            
            if (!store.geoObjectInited) {
                store.geoObject.options.set(options);
                store.geoObject.properties.set(properties);
                init();
                store.geoObjectInited = true;
            }
            this.__map.geoObjects.add(store.geoObject);
        },
        
        /**
         * Изменить ограничивающий прямоугольник видимой области карты
         * @param value
         * @protected
         */
        _changeBounds: function(value) {
            this.__map.setBounds(value);
        },
        
        /**
         * Изменить центр карты
         * @param value
         * @protected
         */
        _changeCenter: function(value) {
            this.__map.setCenter(value);
        },
        
        /**
         * Сменить открытый балун объекта
         * @param {croc.ui.map.GeoObject} object
         * @param {croc.ui.map.GeoObject} oldObject
         * @param {boolean} internal
         * @protected
         */
        _changeOpenedBalloon: function(object, oldObject, internal) {
            if (internal) {
                return;
            }
            
            var store;
            if (oldObject) {
                store = croc.utils.objUserData(this, oldObject);
                if (store.balloon) {
                    store.balloon.close();
                }
            }
            
            if (object) {
                store = croc.utils.objUserData(this, object);
                if (store.balloon) {
                    store.balloon.open();
                }
            }
        },
        
        /**
         * Изменить ограничивающий прямоугольник видимой области карты
         * @param value
         * @protected
         */
        _changeZoom: function(value) {
            this.__map.setZoom(value);
        },
        
        /**
         * Возвратить ограничивающий прямоугольник видимой области карты
         * @protected
         * @returns {Array.<number>}
         */
        _getBounds: function() {
            return this.__map.getBounds();
        },
        
        /**
         * Возвратить центр карты
         * @protected
         * @returns {Array.<number>}
         */
        _getCenter: function() {
            return this.__map.getCenter();
        },
        
        /**
         * Возвратить ограничивающий прямоугольник видимой области карты
         * @protected
         * @returns {number}
         */
        _getZoom: function() {
            return this.__map.getZoom();
        },
        
        /**
         * Загрузить API карт
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _loadApi: function() {
            return croc.getService(croc.services.Resources).loadScript('ymaps');
        },
        
        /**
         * Обработать объект карты с адресом
         * @param {Object} object
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _processAddressObject: function(object) {
            //todo обработать ошибку
            var deferred = $.Deferred();
            ymaps.geocode(object.address).then(
                function(result) {
//                    if (!res.metaData.geocoder.found) {
//                        if (this.addressWasNotFoundMessage) {
//                            failure(this.addressWasNotFoundMessage);
//                        }
//                    }
//                    else {
                    var resultObject = result.geoObjects.get(0);
                    object.center = resultObject.geometry.getCoordinates();
                    croc.utils.objUserData(this, object).geoObject = resultObject;
                    deferred.resolve();
                    return result;
                }.bind(this));
            
            return deferred;
        },
        
        /**
         * Удалить объект с карты
         * @param {croc.ui.map.GeoObject} object
         * @protected
         */
        _removeGeoObject: function(object) {
            this.__map.geoObjects.remove(croc.utils.objUserData(this, object).geoObject);
        },
        
        /**
         * Отрисовывает карту, используя свойства zoom, center, bounds. После рендеринга подписывается на события
         * карты: изменение center, zoom, bounds.
         * @param {Object} controls
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _renderMap: function(controls) {
            var config = {
                maxZoom: croc.ui.map.AbstractMap.MAX_ZOOM,
                type: 'yandex#map',
                behaviors: ['default', 'scrollZoom']
            };
            
            if (this.getCenter()) {
                config.center = this.getCenter();
                config.zoom = this.getZoom();
            }
            else if (this.getBounds()) {
                _.assign(config, ymaps.util.bounds.getCenterAndZoom(
                    this.getBounds(),
                    [this.getElement().width(), this.getElement().height()]
                ));
            }
            
            this.__map = new ymaps.Map(this.getElement()[0], config);
            
            this.__map.controls.add('zoomControl').add('typeSelector');
            if (controls.toolbar) {
                this.__map.controls.add('mapTools');
            }
            if (controls.search) {
                this.__map.controls.add('searchControl');
            }
            
            //bindings
            this.__map.events.add('boundschange', function() {
                this._updateState();
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initBalloonElement: function(object) {
            var store = this.getUserData(object);
            var el = store.balloonElement =
                $(store.balloonCmp.getOverlay().getElement()).find('.b-map-balloon-content');
            
            this.fireEvent('balloonElementReady', object, store.balloonElement);
        },
        
        /**
         * @param object
         * @private
         */
        __updateBalloonContent: function(object) {
            if (typeof object.balloon.content === 'function') {
                var store = croc.utils.objUserData(this, object);
                store.geoObject.properties.set({balloonContent: this._getBalloonContent(object)});
                this.__initBalloonElement(object);
            }
        }
    }
});