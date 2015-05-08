/**
 * Компонент слайдера
 * По-умолчанию hostId = 'slider'
 * При инициализации из разметки компоненту нужно натравить элеметы слайдера:
 * - js-slider-list (список элементов)
 * - js-slider-left, js-slider-right (стрелочки)
 */
croc.Class.define('croc.ui.list.Slider', {
    extend: croc.ui.list.View,
    
    statics: {
        /**
         * Константа ширины элемента для расчёта кол-ва видимых элементов
         * @private
         * @static
         */
        __ITEM_WIDTH: 184,
        
        /**
         * @private
         * @static
         */
        __TEMPLATE_SWITCHER_ITEM: '<div class="b-switcher-item"><div class="b-switcher-item-h"></div></div>'
    },
    
    properties: {
        loading: {
            type: 'boolean',
            _setter: null,
            event: true
        }
    },
    
    options: {
        /**
         * Автоматически вызывать метод onResize при изменении размеров окна
         * @type {boolean}
         */
        autoResize: true,
        
        /**
         * Шаблон по-умолчанию
         * @type {string|$.Deferred}
         */
        htmlTemplate: '' +
        '<div class="_b-slider{cls}">' +
        '   <div class="_b-slider-list js-slider-list">{items}</div>' +
        '   <div class="_b-slider-arrow side_left js-slider-left"></div>' +
        '   <div class="_b-slider-arrow side_right js-slider-right"></div>' +
        '</div>',
        
        /**
         * Идентификатор виджета, по которому будет осуществляться поиск дочерних элементов и субэлементов
         * @type {string}
         */
        hostId: 'slider',
        
        /**
         * Враппер, в который оборачивается дочерний элемент
         * @type {function|string}
         */
        itemWrapper: '<div class="_b-slider-item js-wrapper">{item}</div>',
        
        /**
         * Если задана конфигурация для свитчера, то отображаем свитчер
         * @see croc.ui.bricks.Switcher
         * @type {Object}
         */
        switcherConf: {},
        
        /**
         * Диапазон видимых элементов (min, max) в зависимости от ширины окна
         * @type {Array}
         */
        visibleItemsRange: [2, 8]
    },
    
    members: {
        /**
         * Уведомить виджет о том, что размеры рамок изменились
         * Причины вызова метода: reposition, modelChange, show, parentResize, bubbleResize
         * @param {string} [reason]
         */
        onResize: function(reason) {
            croc.ui.list.Slider.superclass.onResize.apply(this, arguments);
            
            if (this.getListElements().length === 0 || !this.getElement().is(':visible')) {
                return;
            }
            
            var count = Math.round(this.getSubElement('list').width() / croc.ui.list.Slider.__ITEM_WIDTH);
            var manager = this.getVisibleItemsManager();
            
            count = Math.max(this.__visibleItemsRange[0], count);
            count = Math.min(this.__visibleItemsRange[1], count);
            
            this.getElement().removeClass(function(i, css) {
                return (css.match(/view_[0-9]+/g) || []).join(' ');
            }).addClass('view_' + count);
            manager.setVisibleItemsCount(count);
            manager.goToPage(manager.getPageNumber());
        },
        
        /**
         * Инициализация свойства loading
         * @protected
         */
        _bindLoading: function() {
            if (croc.Interface.check(this.getModel(), 'croc.data.IStreamList')) {
                this.getModel().bind('loading', this, '_loading');
            }
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.list.Slider.superclass._initWidget.apply(this, arguments);
            
            this._bindLoading();
            this.__setUpNavigation();
            if (this.__switcherConf) {
                this.__setUpSwitcher();
            }
            
            this.onResize();
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            options.visibleItemsManager = new croc.ui.list.itemsManager.Paging();
            options.listParams.insertTo = '._b-slider-list';
            
            this.__switcherConf = options.switcherConf;
            this.__visibleItemsRange = options.visibleItemsRange;
            
            croc.ui.list.Slider.superclass._onPropertiesInitialized.apply(this, arguments);
        },
        
        /**
         * @private
         */
        __setUpNavigation: function() {
            var visibleManager = this.getVisibleItemsManager();
            
            var left = this.getSubElement('left').on('click', function() {
                if (!left.hasClass('state_disabled')) {
                    visibleManager.prevPage();
                }
            }.bind(this));
            visibleManager.listenProperty('hasPrevItems', function(x) { left.toggleClass('state_disabled', !x); });
            
            var right = this.getSubElement('right').on('click', function() {
                if (!right.hasClass('state_disabled')) {
                    visibleManager.nextPage();
                }
            }.bind(this));
            visibleManager.on('changeHasNextItems', function(x) { right.toggleClass('state_disabled', !x); });
            
            this.on('changeLoading', function(x) {
                left.toggleClass('state_disabled', x || !visibleManager.getHasPrevItems());
                right.toggleClass('state_disabled', x || !visibleManager.getHasNextItems());
            }, this);
        },
        
        /**
         * @private
         */
        __setUpSwitcher: function() {
            var manager = this.getVisibleItemsManager();
            croc.Object.listenProperties(
                manager, 'visibleItemsCount',
                this.getModel(), 'length',
                function(count, length) {
                    var pointsCount = count > 0 ? Math.ceil(length / count) : 0;
                    
                    if (this.__switcher) {
                        this.__switcher.setCount(pointsCount);
                    }
                    else if (pointsCount > 1) {
                        this.__switcher = new croc.ui.bricks.Switcher(_.assign({
                            count: pointsCount,
                            renderTo: this.getElement(),
                            tplItem: croc.ui.list.Slider.__TEMPLATE_SWITCHER_ITEM,
                            listeners: {
                                change: function(cmp, index) {
                                    manager.goToPage(index);
                                }.bind(this)
                            }
                        }, this.__switcherConf));
                    }
                }, this);
            
            manager.on('changePageView', function() {
                if (this.__switcher) {
                    this.__switcher.setActive(manager.getPageNumber());
                }
            }, this);
        }
    }
});