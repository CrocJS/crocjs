/**
 * Виджет карты
 */
croc.Class.define('croc.ui.map.AbstractMap', {
    type: 'abstract',
    extend: croc.ui.Widget,
    implement: croc.ui.map.IMap,
    
    statics: {
        /**
         * @static
         */
        MAX_ZOOM: 18,
        
        /**
         * @static
         * @private
         */
        __TEMPLATE_ERROR: '<div class="b-map-error">Ошибка при загрузке карт. Попробуйте позже.</div>'
    },
    
    events: {
        /**
         * Dom-element for balloon is ready
         * @param {Object} geoObject
         * @param {jQuery} el
         */
        balloonElementReady: null,
        
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
            type: 'array',
            field: '__bounds',
            getter: null,
            compare: _.isEqual,
            apply: '_applyBounds',
            event: true,
            option: true
        },
        
        /**
         * Центр карты ([x1, x2])
         * @type {Array.<number>}
         */
        center: {
            type: 'array',
            field: '__center',
            getter: null,
            compare: croc.utils.arrEqual,
            apply: '_applyCenter',
            event: true,
            option: true
        },
        
        /**
         * Отрисована ли карта
         * @type {boolean}
         */
        mapRendered: {
            type: 'boolean',
            _getter: null,
            __setter: null,
            value: false
        },
        
        /**
         * Объект с открытым балуном
         * @type {croc.ui.map.GeoObject}
         */
        openedBalloon: {
            type: 'object',
            apply: '__changeBalloon',
            event: true
        },
        
        /**
         * Зум карты
         * @type {number}
         */
        zoom: {
            type: 'number',
            value: 9,
            field: '__zoom',
            getter: null,
            transform: function(value) {
                return value === null ? value : Math.max(1, Math.min(croc.ui.map.AbstractMap.MAX_ZOOM, value));
            },
            apply: '_applyZoom',
            event: true,
            option: true
        }
    },
    
    options: {
        /**
         * Показать контролы
         * @type {Object}
         */
        controls: {
            type: 'object',
            extend: true,
            value: {
                search: false,
                toolbar: false
            }
        },
        
        /**
         * Массив объектов на карте {@link croc.ui.map.GeoObject}
         * @type {Array.<croc.ui.map.GeoObject>|croc.data.ObservableArray}
         */
        geoObjects: null,
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '<div class="b-map{cls}"></div>'
    },
    
    construct: function(options) {
        this.once('renderFailed', function() {
            if (this.getElement()) {
                this.getElement().html(croc.ui.map.AbstractMap.__TEMPLATE_ERROR);
            }
        }, this);
        this.on('balloonElementReady', function(object, el) {
            var store = this.getUserData(object);
            if (store.balloonWidget) {
                store.balloonWidget.dispose();
                var widget = store.balloonWidget = object.balloon.content(object);
                el.find('*').off();
                widget.createHtml();
                widget.initWith(el.children(':eq(0)'));
                widget.on('resize', function() {
                    this.updateBalloon(object);
                }, this);
            }
            else {
                el.off();
                el.html(el.html());
            }
            if (object.balloon.onInitElement) {
                object.balloon.onInitElement(object, store.balloonElement);
            }
        }, this);
        //this.__popupBalloons = Stm.env.ldevice === 'mobile';
        croc.ui.map.AbstractMap.superclass.construct.apply(this, arguments);
    },
    
    destruct: function() {
        this.__geoObjects.forEach(function(object) {
            var store = this.getUserData(object);
            if (store.balloonWidget) {
                store.balloonWidget.dispose();
            }
        });
    },
    
    members: {
        /**
         * Возобновить рендеринг объектов
         */
        flush: function() {
            this.__renderingStopped = false;
            if (this.__flushFn) {
                this.__flushFn();
            }
        },
        
        /**
         * Массив объектов на карте {@link croc.ui.map.GeoObject}
         * @returns {croc.data.ObservableArray}
         */
        getGeoObjects: function() {
            return this.__geoObjects;
        },
        
        /**
         * Имя сервиса карт
         * @returns {string}
         */
        getServiceName: function() { throw 'abstract!'; },
        
        /**
         * Уведомить виджет о том, что размеры рамок изменились
         * @param {string} [reason]
         */
        onResize: function(reason) {
            croc.ui.map.AbstractMap.superclass.onResize.apply(this, arguments);
            this.redraw();
        },
        
        /**
         * Перерисовка карты
         */
        redraw: function() {},
        
        /**
         * Update balloon size for geo object
         */
        updateBalloon: function(object) {},
        
        /**
         * Приостановить рендеринг объектов
         */
        stopRendering: function() {
            this.__renderingStopped = true;
        },
        
        /**
         * Добавить на карту объект
         * @param {croc.ui.map.GeoObject} object
         * @protected
         */
        _addGeoObject: function(object) { throw 'abstract!'; },
        
        /**
         * @param value
         * @param oldValue
         * @param internal
         * @protected
         */
        _applyCenter: function(value, oldValue, internal) {
            if (!internal && this._getMapRendered() && value) {
                this._changeCenter(value);
            }
        },
        
        /**
         * @param value
         * @param oldValue
         * @param internal
         * @protected
         */
        _applyBounds: function(value, oldValue, internal) {
            if (!internal && this._getMapRendered() && value) {
                this._changeBounds(value);
            }
        },
        
        /**
         * @param value
         * @param oldValue
         * @param internal
         * @protected
         */
        _applyZoom: function(value, oldValue, internal) {
            if (!internal && this._getMapRendered() && value) {
                this._changeZoom(value);
            }
        },
        
        /**
         * Изменить ограничивающий прямоугольник видимой области карты
         * @param {Array.<Array.<number>>} value
         * @protected
         */
        _changeBounds: function(value) { throw 'abstract!'; },
        
        /**
         * Изменить центр карты
         * @param {Array.<number>} value
         * @protected
         */
        _changeCenter: function(value) { throw 'abstract!'; },
        
        /**
         * Сменить открытый балун объекта
         * @param {croc.ui.map.GeoObject} object
         * @param {croc.ui.map.GeoObject} oldObject
         * @param {boolean} internal
         * @protected
         */
        _changeOpenedBalloon: function(object, oldObject, internal) { throw 'abstract!'; },
        
        /**
         * Изменить ограничивающий прямоугольник видимой области карты
         * @param {number} value
         * @protected
         */
        _changeZoom: function(value) { throw 'abstract!'; },
        
        /**
         * @param object
         * @returns {string}
         * @protected
         */
        _getBalloonContent: function(object) {
            var content = typeof object.balloon.content === 'function' ?
                object.balloon.content(object) : object.balloon.content;
            if (content instanceof croc.ui.Widget) {
                var store = this.getUserData(object);
                if (store.balloonWidget) {
                    store.balloonWidget.dispose();
                }
                store.balloonWidget = content;
                content = croc.utils.defSync(content.createHtml());
            }
            
            //return this.__popupBalloons ? content : '<div class="b-map-balloon-content">' + content + '</div>';
            return '<div class="b-map-balloon-content">' + content + '</div>';
        },
        
        /**
         * Возвратить ограничивающий прямоугольник видимой области карты
         * @protected
         * @returns {Array.<number>}
         */
        _getBounds: function() { throw 'abstract!'; },
        
        /**
         * Возвратить центр карты
         * @protected
         * @returns {Array.<number>}
         */
        _getCenter: function() { throw 'abstract!'; },
        
        /**
         * Возвратить ограничивающий прямоугольник видимой области карты
         * @protected
         * @returns {number}
         */
        _getZoom: function() { throw 'abstract!'; },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.map.AbstractMap.superclass._initWidget.apply(this, arguments);
            
            this.__blocker = new croc.ui.util.Blocker({
                target: this.getElement(),
                type: 'big'
            });
            
            //ждём загрузки апи
            return $.when(this._loadApi()).then(
                function() {
                    var geoObjectsUnbinder = this.__geoObjects.listenChanges(function(index, remove, insert) {
                        insert.forEach(function(object) {
                            if (object.address && !object.center) {
                                this.__loadingDeferred = $.when(this.__loadingDeferred,
                                    this._processAddressObject(object));
                            }
                        }, this);
                    }, this);
                    
                    //ждём обработки всех адресов
                    return $.when(this.__loadingDeferred).then(
                        function() {
                            geoObjectsUnbinder();
                            return this.__initMap();
                        }.bind(this),
                        croc.utils.defRejectCallback);
                }.bind(this),
                croc.utils.defRejectCallback);
        },
        
        /**
         * Загрузить API карт
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _loadApi: function() { throw 'abstract!'; },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.map.AbstractMap.superclass._onPropertiesInitialized.apply(this, arguments);
            
            /**
             * @type {croc.data.ObservableArray}
             * @private
             */
            this.__geoObjects = croc.Object.createModel(options.geoObjects || [], false);
            
            /**
             * @private
             */
            this.__loadingDeferred = null;
            
            /**
             * @private
             */
            this.__controls = options.controls;
            
            this.__geoObjects.listenChanges(function(index, remove, insert) {
                insert.forEach(function(object) {
                    if (object.type !== 'placemark' && object.type !== 'polygon') {
                        throw new Error('Не передан тип гео объекта: ' + JSON.stringify(object));
                    }
                });
            });
        },
        
        /**
         * Обработать объект карты с адресом
         * @param {Object} object
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _processAddressObject: function(object) { throw 'abstract!'; },
        
        /**
         * Удалить объект с карты
         * @param {croc.ui.map.GeoObject} object
         * @protected
         */
        _removeGeoObject: function(object) { throw 'abstract!'; },
        
        /**
         * Отрисовывает карту, используя свойства zoom, center, bounds. После рендеринга подписывается на события
         * карты: изменение center, zoom, bounds.
         * @param {Object} controls
         * @returns {jQuery.Deferred|undefined}
         * @protected
         */
        _renderMap: function(controls) { throw 'abstract!'; },
        
        /**
         * Обновить zoom, center, bounds
         * @protected
         */
        _updateState: function() {
            this.setBounds(this._getBounds(), true);
            this.setCenter(this._getCenter(), true);
            this.setZoom(this._getZoom(), true);
        },
        
        /**
         * @param object
         * @param old
         * @param _internal
         * @private
         */
        __changeBalloon: function(object, old, _internal) {
            if (!this._getMapRendered()) {
                return;
            }
            //if (this.__popupBalloons) {
            //    if (object) {
            //        this._getDisposer().defer(function() {
            //            new croc.ui.popup.Popup({
            //                content: this._getBalloonContent(object),
            //                opener: this
            //            }).open();
            //        }, this);
            //    }
            //}
            //else {
            this._changeOpenedBalloon.apply(this, arguments);
            //}
        },
        
        /**
         * @private
         * @returns {$.Deferred}
         */
        __initMap: function() {
            if (!this.getBounds() && !this.getCenter()) {
                //todo сделать и для полигона
                var placemarks = this.__geoObjects.getArray().filter(function(x) { return x.type === 'placemark'; });
                
                if (placemarks.length === 1) {
                    this.setCenter(placemarks[0].center);
                }
                else if (placemarks.length > 1) {
                    this.setBounds(placemarks.reduce(function(bounds, point) {
                        return croc.ui.map.Helper.addPointToBounds(bounds, point.center);
                    }, null));
                }
                else {
                    this.setCenter([27.565323117168838, 77.68342249999999]);
                    this.setZoom(12);
                }
            }
            
            var renderDeferred;
            if (this.isVisible()) {
                renderDeferred = this._renderMap(this.__controls);
            }
            else {
                renderDeferred = $.Deferred();
                this.once('appear', function() {
                    $.when(this._renderMap(this.__controls)).then(renderDeferred.resolve, renderDeferred.reject);
                }, this);
            }
            
            return $.when(renderDeferred).done(function() {
                this._updateState();
                
                this.__blocker.setBlocked(false);
                this.__setMapRendered(true);
                this.__setUpRendering();
            }.bind(this));
        },
        
        /**
         * @private
         */
        __setUpRendering: function() {
            var balloonWasSet = false;
            var renderedGeoObjects = {};
            var addGeoObject = function(object) {
                this._addGeoObject(object);
                renderedGeoObjects[croc.utils.objUniqueId(object)] = true;
                if (object.balloon && object.balloon.opened) {
                    object.balloon.opened = false;
                    this.setOpenedBalloon(object);
                    balloonWasSet = true;
                }
            }.bind(this);
            
            var updateGeoObjects = function(remove, insert) {
                remove.forEach(function(object) {
                    if (insert.indexOf(object) === -1) {
                        if (this.getOpenedBalloon() === object) {
                            this.setOpenedBalloon(null);
                        }
                        var store = this.getUserData(object);
                        if (store.balloonWidget) {
                            store.balloonWidget.dispose();
                        }
                        this._removeGeoObject(object);
                        delete renderedGeoObjects[croc.utils.objUniqueId(object)];
                    }
                }, this);
                
                insert.forEach(function(object) {
                    if (!renderedGeoObjects[croc.utils.objUniqueId(object)]) {
                        if (object.address && !object.center) {
                            $.when(this._processAddressObject(object)).done(function() {
                                if (this.__geoObjects.indexOf(object) !== -1) {
                                    addGeoObject(object);
                                }
                            }.bind(this));
                        }
                        else {
                            addGeoObject(object);
                        }
                    }
                }, this);
            }.bind(this);
            
            this.__flushFn = function() {
                updateGeoObjects(_.uniq(removeQueue), _.uniq(insertQueue));
                timeout = null;
                removeQueue = [];
                insertQueue = [];
            };
            
            var timeout;
            var removeQueue = [];
            var insertQueue = [];
            this.__geoObjects.on('change', function(index, remove, insert) {
                insertQueue = _.difference(insertQueue, remove);
                removeQueue = _.difference(removeQueue, insert);
                
                removeQueue = removeQueue.concat(remove);
                insertQueue = insertQueue.concat(insert);
                
                if (!this.__renderingStopped && !timeout) {
                    timeout = this._getDisposer().defer(this.__flushFn);
                }
            }, this);
            
            updateGeoObjects([], this.__geoObjects.getArray());
            
            if (!balloonWasSet && this.getOpenedBalloon()) {
                this.__changeBalloon(this.getOpenedBalloon(), null, false);
            }
        }
    }
});