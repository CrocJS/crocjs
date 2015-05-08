//+use bower:jquery-cookie

/**
 * Виджет карты с возможностью переключения между google и yandex maps
 * todo моментальное изменение зума при переключении карт
 */
croc.Class.define('croc.ui.map.MultiMap', {
    extend: croc.ui.Container,
    implement: croc.ui.map.IMap,
    
    statics: {
        /**
         * @private
         * @static
         */
        __MAPS_CLASSES: {
            yandex: croc.ui.map.YandexMap,
            google: croc.ui.map.GoogleMap
        },
        
        /**
         * @private
         * @static
         */
        __PREFERRED_MAP_COOKIE: 'c_preferred_map'
    },
    
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
            type: 'array',
            compare: _.isEqual,
            event: true,
            option: true
        },
        
        /**
         * Центр карты ([x1, x2])
         * @type {Array.<number>}
         */
        center: {
            type: 'array',
            compare: croc.utils.arrEqual,
            event: true,
            option: true
        },
        
        /**
         * Активная в данный момент карта (google, yandex)
         * @type {string}
         */
        map: {
            type: 'string',
            event: true,
            option: true
        },
        
        /**
         * Объект с открытым балуном
         * @type {croc.ui.map.GeoObject}
         */
        openedBalloon: {
            type: 'object',
            event: true
        },
        
        /**
         * Зум карты
         * @type {number}
         */
        zoom: {
            type: 'number',
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
        htmlTemplate: '' +
        '<div class="b-map-multi{cls}">' +
        '   <div class="b-map-multi-container">{items}</div>' +
        '   {items:switcher}' +
        '</div>',
        
        /**
         * Карты доступные для выбора
         * @type {Array.<string>}
         */
        maps: {
            type: 'array',
            value: ['google', 'yandex']
        }
    },
    
    members: {
        /**
         * Возобновить рендеринг объектов
         */
        flush: function() {
            if (this.__activeMap) {
                this.__activeMap.flush();
            }
        },
        
        /**
         * Фокусировка на точке
         * @param {Object} [object]
         * @param {Object} [params]
         * @param {boolean} [params.openBalloon=false]
         * @param {number} [params.zoom]
         */
        focusOnObject: function(object, params) {
            if (!params) {
                params = {};
            }
            this.flush();
            this.setCenter(object.center);
            if (params.zoom) {
                this.setZoom(params.zoom);
            }
            if (params.openBalloon) {
                this.setOpenedBalloon(null);
                this.setOpenedBalloon(object);
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
         * Перерисовка карты
         */
        redraw: function() {
            if (this.__activeMap) {
                this.__activeMap.redraw();
            }
        },
        
        /**
         * Приостановить рендеринг объектов
         */
        stopRendering: function() {
            if (this.__activeMap) {
                this.__activeMap.stopRendering();
            }
        },
        
        /**
         * Секция дочерних элементов по-умолчанию
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return 'maps';
        },
        
        /**
         * Update balloon size for geo object
         */
        updateBalloon: function(object) {
            if (this.__activeMap) {
                return this.__activeMap.updateBalloon.apply(this, arguments);
            }
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.map.MultiMap.superclass._initWidget.apply(this, arguments);
            
            /**
             * @type {croc.ui.map.IMap}
             * @private
             */
            this.__activeMap = null;
            
            /**
             * @type {croc.util.Disposer}
             * @private
             */
            this.__mapDisposer = new croc.util.Disposer();
            
            /**
             * @type {Object.<string, croc.ui.map.IMap>}
             * @private
             */
            this.__maps = {};
            
            if (!this.getMap()) {
                var preferredMap = $.cookie(croc.ui.map.MultiMap.__PREFERRED_MAP_COOKIE);
                this.setMap(preferredMap && this.__mapsNames.indexOf(preferredMap) !== -1 ?
                    preferredMap : this.__mapsNames[0]);
            }
            
            var bindProperties = function(map) {
                var source = this;
                var dest = map;
                if (!this.getCenter() && map.getCenter()) {
                    source = map;
                    dest = this;
                }
                this.__mapDisposer.addCallbacks(
                    croc.Object.twoWaysBinding(source, 'center', dest, 'center'),
                    croc.Object.twoWaysBinding(source, 'zoom', dest, 'zoom'),
                    croc.Object.twoWaysBinding(dest, 'bounds', source, 'bounds'),
                    croc.Object.twoWaysBinding(this, 'openedBalloon', map, 'openedBalloon')
                );
            }.bind(this);
            
            //таймаут на время синхроинзации
            var toggleMaps = _.debounce(this.disposableFunc(function(prevMap, map) {
                prevMap.setShown(false);
                map.setShown(true);
                if (map.getRendered()) {
                    map.redraw();
                }
                bindProperties(map);
            }, this), 50);
            
            this.listenProperty('map', function(name) {
                this.__setPreferredMap(name);
                
                var prevMap = this.__activeMap;
                if (prevMap) {
                    this.__mapDisposer.disposeAll();
                }
                
                var map = this.__activeMap = this.__getMap(name);
                
                this.__mapDisposer.addCallbacks(
                    croc.data.ObservableArray.linkArrays(this.__geoObjects, map.getGeoObjects()));
                
                if (prevMap) {
                    toggleMaps(prevMap, map);
                }
                else {
                    bindProperties(map);
                }
            }, this);
            
            //redraw on show
            this.on('changeShown', function(shown) {
                if (shown) {
                    this.redraw();
                }
            }, this);
        },
        
        /**
         * Вставить дочерний элемент в определённую секцию
         * @param {string} section
         * @param {jQuery} elements
         * @param {jQuery} beforeElement
         * @param {Array.<croc.ui.Widget>} widgets
         * @protected
         */
        _insertItems: function(section, elements, beforeElement, widgets) {
            if (beforeElement) {
                croc.ui.map.MultiMap.superclass._insertItems.apply(this, arguments);
            }
            else {
                this.getElement().find('.b-map-multi-container').append(elements);
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.map.MultiMap.superclass._onPropertiesInitialized.apply(this, arguments);
            
            /*
             * @type {croc.data.ObservableArray}
             * @private
             */
            this.__geoObjects = croc.Object.createModel(options.geoObjects || [], false);
            
            /**
             * @type {Object}
             * @private
             */
            this.__controls = options.controls;
            
            /**
             * @type {Array.<string>}
             * @private
             */
            this.__mapsNames = options.maps;
            
            /**
             * @type {croc.ui.form.field.RadioButtonsSet}
             * @private
             */
            this.__switcher = new croc.ui.form.field.RadioButtonsSet({
                mod: 'maps-switcher',
                valueSource: 'identifier',
                dItemDefaults: {
                    extraCls: 'clip_rect',
                    size: '1'
                },
                items: options.maps.map(function(name) {
                    return {
                        identifier: name,
                        icon: {html: '<span class="b-map-multi-icon mod_' + name + '"></span>'}
                    };
                }),
                shown: options.maps.length > 1
            });
            croc.Object.twoWaysBinding(this, 'map', this.__switcher, 'value');
            
            options.items = {
                maps: [],
                switcher: [this.__switcher]
            };
        },
        
        /**
         * Поиск элементов DOM для всех дочерних элементов
         * @param {jQuery} el
         * @param {Object} options
         * @return {Object.<string, jQuery>}
         * @protected
         */
        _scanForItemsElements: function(el, options) {
            return {
                maps: el.find('.b-map'),
                switcher: el.find('.b-sbutton-set.mod_maps-switcher')
            };
        },
        
        /**
         * @param {string} name
         * @returns {croc.ui.map.IMap}
         * @private
         */
        __getMap: function(name) {
            if (!this.__maps[name]) {
                var Cls = croc.ui.map.MultiMap.__MAPS_CLASSES[this.getMap()];
                
                this.__maps[name] = this.add(new Cls({
                    bounds: this.getBounds(),
                    center: this.getCenter(),
                    zoom: this.getZoom(),
                    geoObjects: this.__geoObjects.cloneRawArray(),
                    controls: this.__controls,
                    listeners: {
                        renderFailed: function() {
                            //если произошла ошибка при загрузке карты - подгружаем новую
                            var nextMapIndex = this.__mapsNames.indexOf(name) + 1;
                            if (nextMapIndex >= this.__mapsNames.length) {
                                nextMapIndex = 0;
                            }
                            var nextMapName = this.__mapsNames[nextMapIndex];
                            
                            if (!this.__maps[nextMapName] || !this.__maps[nextMapName].isRenderFailed()) {
                                this._getDisposer().defer(function() {
                                    this.setMap(nextMapName);
                                }, this);
                            }
                        }.bind(this),
                        
                        geoObjectClick: function() {
                            this.fireEvent.apply(this, ['geoObjectClick'].concat(_.toArray(arguments)));
                        }.bind(this)
                    }
                }))[0];
            }
            
            return this.__maps[name];
        },
        
        /**
         * @param name
         * @private
         */
        __setPreferredMap: function(name) {
            $.cookie(croc.ui.map.MultiMap.__PREFERRED_MAP_COOKIE, name, {
                expires: 365
                //domain: '*.' + app.store.links.domain
            });
            $.cookie(croc.ui.map.MultiMap.__PREFERRED_MAP_COOKIE, name, {
                expires: 365,
                domain: location.hostname
            });
        }
    }
});