/**
 * Виджет карты Google Map
 */
croc.Class.define('croc.ui.map.GoogleMap', {
    extend: croc.ui.map.AbstractMap,
    
    options: {
        /**
         * @type {string}
         */
        mod: 'google'
    },
    
    members: {
        /**
         * Имя сервиса карт
         * @returns {string}
         */
        getServiceName: function() {
            return 'google';
        },
        
        /**
         * Перерисовка карты
         */
        redraw: function() {
            croc.ui.map.GoogleMap.superclass.redraw.apply(this, arguments);
            if (this.__map) {
                google.maps.event.trigger(this.__map, 'resize');
            }
            
            if (this.__restoreBalloon && this.getOpenedBalloon() === this.__restoreBalloon) {
                var store = croc.utils.objUserData(this, this.__restoreBalloon);
                store.balloon.close();
                store.balloon.open(this.__map, store.geoObject);
            }
            this.__restoreBalloon = null;
        },
        
        /**
         * Добавить на карту объект
         * @param {croc.ui.map.GeoObject} object
         * @protected
         */
        _addGeoObject: function(object) {
            var options = {};
            var store = croc.utils.objUserData(this, object);
            if (!store.geoObject) {
                
                if (object.hint) {
                    options.title = object.hint;
                }
                
                if (typeof object.icon === 'string') {
                    options.icon = croc.ui.map.Helper.ICONS_MAP.gmaps[object.icon];
                }
                else if (object.icon) {
                    options.icon = {
                        url: object.icon.href
                    };
                    if (object.icon.size) {
                        options.icon.size = new google.maps.Size(object.icon.size[0], object.icon.size[1]);
                    }
                    if (object.icon.offset) {
                        options.icon.anchor = new google.maps.Point(-object.icon.offset[0],
                            -object.icon.offset[1]);
                    }
                }
                
                if (object.type === 'placemark') {
                    options.position = this.__createLatLng(object.center);
                }
                else if (object.type === 'polygon') {
                    options.paths = object.points.map(function(x) { return this.__createLatLng(x); }, this);
                    options.paths.push(this.__createLatLng(object.points[0]));
                    
                    if (object.fill) {
                        if (object.fill.color) {
                            options.fillColor = '#' + object.fill.color;
                        }
                        if (object.fill.opacity) {
                            options.fillOpacity = object.fill.opacity;
                        }
                    }
                    if (object.stroke) {
                        if (object.stroke.color) {
                            options.strokeColor = '#' + object.stroke.color;
                        }
                        if (object.stroke.opacity) {
                            options.strokeOpacity = object.stroke.opacity;
                        }
                        if (object.stroke.width) {
                            options.strokeWeight = object.stroke.width;
                        }
                    }
                }
                
                store.geoObject = object.type === 'polygon' ?
                    new google.maps.Polygon(options) :
                    new google.maps.Marker(options);
                
                google.maps.event.addListener(store.geoObject, 'click', function() {
                    this.fireEvent('geoObjectClick', object);
                }.bind(this));
                
                if (object.balloon) {
                    store.balloonElement = $(this._getBalloonContent(object));
                    store.balloon = new google.maps.InfoWindow({
                        content: store.balloonElement[0]
                    });
                    
                    //var loader = store.imgLoader = new croc.util.ImagesPreloader();
                    //loader.scanElement(store.balloonElement);
                    //
                    //store.initTimer = $.Deferred();
                    //this._getDisposer().setTimeout(function() {
                    //    store.initTimer.resolve();
                    //}, 500);
                    
                    google.maps.event.addListener(store.geoObject, 'click', function(event) {
                        this.setOpenedBalloon(object);
                    }.bind(this));
                    google.maps.event.addListener(store.balloon, 'closeclick', function() {
                        this.setOpenedBalloon(null, true);
                    }.bind(this));
                    
                    google.maps.event.addListener(store.balloon, 'domready', function() {
                        this.fireEvent('balloonElementReady', object, store.balloonElement);
                        this.__moveMapToShowBalloon(object);
                    }.bind(this));
                    
                    var oldUpdate = object.balloon.update;
                    object.balloon.update = function() {
                        if (oldUpdate) {
                            oldUpdate.call(this);
                        }
                        if (typeof object.balloon.content === 'function') {
                            store.balloonElement = $(this._getBalloonContent(object));
                            
                            store.balloon.close();
                            store.balloon.setContent(store.balloonElement[0]);
                            if (!this.getElement().is(':visible')) {
                                this.__restoreBalloon = object;
                            }
                            else {
                                if (this.__reopenBallonTimeout) {
                                    this.__reopenBallonTimeout.remove();
                                }
                                this.__reopenBallonTimeout = this._getDisposer().setTimeout(
                                    store.balloon.open.bind(store.balloon, this.__map, store.geoObject), 20);
                            }
                            
                            this.fireEvent('balloonElementReady', object, store.balloonElement);
                        }
                    }.bind(this);
                }
            }
            
            store.geoObject.setMap(this.__map);
        },
        
        /**
         * @param value
         * @param oldValue
         * @param internal
         * @protected
         */
        _applyCenter: function(value, oldValue, internal) {
            if (!internal) {
                this.__initCenter = value;
                this.__initBounds = null;
            }
            croc.ui.map.GoogleMap.superclass._applyCenter.apply(this, arguments);
        },
        
        /**
         * @param value
         * @param oldValue
         * @param internal
         * @protected
         */
        _applyBounds: function(value, oldValue, internal) {
            if (!internal) {
                this.__initBounds = value;
                this.__initCenter = null;
            }
            croc.ui.map.GoogleMap.superclass._applyBounds.apply(this, arguments);
        },
        
        /**
         * @param value
         * @param oldValue
         * @param internal
         * @protected
         */
        _applyZoom: function(value, oldValue, internal) {
            if (!internal) {
                this.__initZoom = value;
            }
            croc.ui.map.GoogleMap.superclass._applyZoom.apply(this, arguments);
        },
        
        /**
         * Изменить ограничивающий прямоугольник видимой области карты
         * @param {Array.<Array.<number>>} value
         * @protected
         */
        _changeBounds: function(value) {
            this.__map.fitBounds(this.__createLatLngBounds(value));
        },
        
        /**
         * Изменить центр карты
         * @param {Array.<number>} value
         * @protected
         */
        _changeCenter: function(value) {
            this.__map.setCenter(this.__createLatLng(value));
        },
        
        /**
         * Сменить открытый балун объекта
         * @param {croc.ui.map.GeoObject} object
         * @param {croc.ui.map.GeoObject} oldObject
         * @param {boolean} internal
         * @private
         */
        _changeOpenedBalloon: function(object, oldObject, internal) {
            var store;
            
            if (this.__reopenBallonTimeout) {
                this._getDisposer().disposeItem(this.__reopenBallonTimeout);
            }
            
            if (oldObject) {
                store = croc.utils.objUserData(this, oldObject);
                if (store.balloon && store.balloon.getMap()) {
                    store.balloon.close();
                }
            }
            
            this.__ballonOpenId = null;
            
            if (!internal && object) {
                store = croc.utils.objUserData(this, object);
                if (store.balloon) {
                    //var id = this.__ballonOpenId = _.uniqueId();
                    //$.when(
                    //    store.imgLoader.getDeferred(),
                    //    store.initTimer
                    //)
                    //    .done(function() {
                    //        if (id === this.__ballonOpenId && !this.isDisposed()) {
                    if (object.type === 'placemark') {
                        store.balloon.open(this.__map, store.geoObject);
                    }
                    else {
                        store.balloon.setPosition(this.__getPolygonCenter(store.geoObject));
                        store.balloon.open(this.__map);
                    }
                    //    }
                    //}.bind(this));
                }
            }
        },
        
        /**
         * Изменить ограничивающий прямоугольник видимой области карты
         * @param {number} value
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
            return this.__parseLatLngBounds(this.__map.getBounds());
        },
        
        /**
         * Возвратить центр карты
         * @protected
         * @returns {Array.<number>}
         */
        _getCenter: function() {
            return this.__parseLatLng(this.__map.getCenter());
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
            return croc.getService(croc.services.Resources).loadScript('gmaps');
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
            
            if (!this.__geoCoder) {
                this.__geoCoder = new google.maps.Geocoder();
            }
            this.__geoCoder.geocode({address: object.address},
                function(results, status) {
                    object.center = this.__parseLatLng(results[0].geometry.location);
                    deferred.resolve();
                }.bind(this));
            
            return deferred;
        },
        
        /**
         * Удалить объект с карты
         * @param {croc.ui.map.GeoObject} object
         * @protected
         */
        _removeGeoObject: function(object) {
            croc.utils.objUserData(this, object).geoObject.setMap(null);
        },
        
        /**
         * Отрисовывает карту, используя свойства zoom, center, bounds. После рендеринга подписывается на события
         * карты: изменение center, zoom, bounds.
         * @param {Object} controls
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _renderMap: function(controls) {
            var deferred = $.Deferred();
            var config = {
                maxZoom: croc.ui.map.AbstractMap.MAX_ZOOM,
                disableDefaultUI: true,
                mapTypeControl: true,
                zoomControl: true
            };
            
            var bounds;
            if (this.getCenter()) {
                this.__initCenter = this.getCenter();
                this.__initZoom = this.getZoom();
                config.center = this.__createLatLng(this.getCenter());
                config.zoom = this.getZoom();
            }
            else if (this.getBounds()) {
                this.__initBounds = this.getBounds();
                bounds = this.__createLatLngBounds(this.getBounds());
            }
            
            this.__map = new google.maps.Map(this.getElement()[0], config);
            
            if (bounds) {
                this.__map.fitBounds(bounds);
            }
            if (controls.search) {
                this.__createSearchControl();
            }
            
            var inited = false;
            google.maps.event.addListener(this.__map, 'idle', function() {
                if (!inited) {
                    inited = true;
                    deferred.resolve();
                    
                    //иногда гуглокарты глючат
                    this.redraw();
                    if (this.__initBounds) {
                        this.setBounds(this.__initBounds.concat());
                    }
                    else {
                        this.setCenter(this.__initCenter);
                        if (this.getZoom() === this.__initZoom) {
                            this._changeZoom(this.__initZoom);
                        }
                        else {
                            this.setZoom(this.__initZoom);
                        }
                    }
                }
                else {
                    this._updateState();
                }
            }.bind(this));
            
            return deferred;
        },
        
        /**
         * @param {Array.<number>} arr
         * @returns {google.maps.LatLng}
         * @private
         */
        __createLatLng: function(arr) {
            return arr && new google.maps.LatLng(arr[0], arr[1]);
        },
        
        /**
         * @param {Array.<Array.<number>>} arr
         * @returns {google.maps.LatLngBounds}
         * @private
         */
        __createLatLngBounds: function(arr) {
            return arr && new google.maps.LatLngBounds(this.__createLatLng(arr[0]), this.__createLatLng(arr[1]));
        },
        
        __createSearchControl: function() {
            var textField = new croc.ui.form.field.TextField({
                renderTo: this.getElement(),
                mod: 'gmaps-search-control'
            });
            
            // Create the search box and link it to the UI element.
            var searchBox = new google.maps.places.SearchBox(textField.getFieldElement()[0]);
            
            var markers = [];
            
            // Listen for the event fired when the user selects an item from the
            // pick list. Retrieve the matching places for that item.
            google.maps.event.addListener(searchBox, 'places_changed', function() {
                var places = searchBox.getPlaces();
                
                var i;
                var marker;
                for (i = 0; (marker = markers[i]); i++) {
                    marker.setMap(null);
                }
                
                // For each place, get the icon, place name, and location.
                markers = [];
                var bounds = new google.maps.LatLngBounds();
                var place;
                for (i = 0; (place = places[i]); i++) {
                    var image = {
                        url: place.icon,
                        size: new google.maps.Size(71, 71),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(25, 25)
                    };
                    
                    // Create a marker for each place.
                    marker = new google.maps.Marker({
                        map: this.__map,
                        icon: image,
                        title: place.name,
                        position: place.geometry.location
                    });
                    
                    markers.push(marker);
                    
                    bounds.extend(place.geometry.location);
                }
                
                this.__map.fitBounds(bounds);
            }.bind(this));
            
            // Bias the SearchBox results towards places that are within the bounds of the
            // current map's viewport.
            google.maps.event.addListener(this.__map, 'bounds_changed', function() {
                searchBox.setBounds(this.__map.getBounds());
            }.bind(this));
        },
        
        /**
         * @param {google.maps.Polygon} polygon
         * @returns {google.maps.LatLng}
         * @private
         */
        __getPolygonCenter: function(polygon) {
            var bounds = new google.maps.LatLngBounds();
            polygon.getPath().forEach(function(element) {
                bounds.extend(element);
            });
            
            return bounds.getCenter();
        },
        
        /**
         * @private
         */
        __moveMapToShowBalloon: function(object) {
            if (!object.center) {
                return;
            }
            
            var store = this.getUserData(object);
            var loader = new croc.util.ImagesPreloader();
            loader.scanElement(store.balloonElement);
            loader.getDeferred().done(function() {
                var el = store.balloonElement.closest('.gm-style-iw').parent();
                var bounds = this.getBounds();
                var center = this.getCenter();
                var unitsInPixel = (bounds[1][0] - bounds[0][0]) / this.getElement().height();
                var lat = bounds[1][0] - (el.height() + 100) * unitsInPixel;
                var delta = object.center[0] - lat;
                if (delta > 0) {
                    this.setCenter([center[0] + delta, center[1]]);
                }
            }.bind(this));
        },
        
        /**
         * @param {google.maps.LatLng} coor
         * @returns {Array.<number>}
         * @private
         */
        __parseLatLng: function(coor) {
            return coor && [coor.lat(), coor.lng()];
        },
        
        /**
         * @param {google.maps.LatLngBounds} bounds
         * @returns {Array.<Array.<number>>}
         * @private
         */
        __parseLatLngBounds: function(bounds) {
            return bounds && [this.__parseLatLng(bounds.getSouthWest()), this.__parseLatLng(bounds.getNorthEast())];
        }
    }
});