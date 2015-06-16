croc.ns('croc.ui.list');

/**
 * Менеджер позволяет прокручивать элементы списка. Если используется свойство visibleItemsCount, то очень важно, чтобы
 * высота каждого элемента была одинаковой! (вплоть до пиксела)
 */
croc.Class.define('croc.ui.list.itemsManager.Scrolling', {
    extend: croc.ui.list.itemsManager.Abstract,
    
    options: {
        /**
         * Прокручивать список дискретно
         * @type {boolean}
         */
        discreteScrolling: true,
        
        /**
         * Если есть предыдущие невидимые элементы, показать соответствующий маркер (например, градиент)
         * @type {boolean}
         */
        hasPrevNextMarker: false,
        
        /**
         * Скрывать маркеры при наведении мыши
         * @type {boolean}
         */
        hidePrevNextMarkers: false,
        
        /**
         * Размер скроллбара
         * @type {string}
         */
        scrollbarSize: {
            type: 'string',
            value: '1'
        },
        
        /**
         * Нужен ли скроллбар
         * @type {boolean}
         */
        scrollbarVisibility: {
            check: ['visible', 'hidden', 'abstract'],
            value: 'abstract'
        },
        
        /**
         * Шаг прокручивания списка в строках
         * @type {number}
         */
        scrollCount: 3
    },
    
    construct: function(options) {
        if (options.hasPrevNextMarker) {
            options.hasPrevItemsClass = 'state_has-prev';
            options.hasNextItemsClass = 'state_has-next';
            options.selectedItemGap = true;
        }
        
        this.__hasPrevNextMarker = options.hasPrevNextMarker;
        this.__hidePrevNextMarkers = options.hidePrevNextMarkers;
        this.__scrollbarVisibility = options.scrollbarVisibility;
        this.__scrollbarSize = options.scrollbarSize;
        this.__discreteScrolling = options.discreteScrolling;
        
        croc.ui.list.itemsManager.Scrolling.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * @return {croc.ui.common.Scrollable}
         */
        getScrollable: function() {
            return this.__scrollable;
        },
        
        /**
         * Перейти к элементу с индексом (показать его первым)
         * @param {number} index
         */
        goToItem: function(index) {
            var model = this.getModel();
            if (model.getLength() === 0) {
                return;
            }
            index = this.getListView().getListItemIndex(index);
            index = Math.min(model.getLength() - 1, Math.max(0, index));
            
            var elements = this.getListView().getListElements();
            this.__scrollableEl.scrollTop(elements[index].offsetTop - elements[0].offsetTop);
            
            this.__updateIndexes();
        },
        
        /**
         * Инициализация менеджера представлением
         * @param {croc.ui.list.View} listView
         * @param {boolean} hasHasMoreItemsMarker
         */
        initListView: function(listView, hasHasMoreItemsMarker) {
            croc.ui.list.itemsManager.Scrolling.superclass.initListView.apply(this, arguments);
            
            var el = listView.getElement();
            
            this.__scrollable = new croc.ui.common.Scrollable({
                el: el,
                visibility: this.__scrollbarVisibility,
                size: this.__scrollbarSize,
                discreteScrolling: this.__discreteScrolling,
                discreteScrollingItems: function() {
                    return listView.getListElements();
                }
            });
            this.__scrollableEl = this.__scrollable.getScrollableElement();
            
            if (this.__hasPrevNextMarker) {
                var markers = $('' +
                '<div class="g-scrollable-marker g-scrollable-prev-marker"></div>' +
                '<div class="g-scrollable-marker g-scrollable-next-marker"></div>');
                el.append(markers);
                
                if (this.__hidePrevNextMarkers) {
                    el.on('mouseenter mouseleave', listView.getListItemsSelector(), function(e) {
                        var index = listView.getListItemIndex($(e.currentTarget));
                        if (index <= this.getFirstVisibleItemIndex()) {
                            markers.eq(0).toggleClass('state_hover', e.type === 'mouseenter');
                        }
                        if (index >= this.getLastVisibleItemIndex()) {
                            markers.eq(1).toggleClass('state_hover', e.type === 'mouseenter');
                        }
                    }.bind(this));
                    this.on('changeFirstVisibleItemIndex', function() {
                        markers.removeClass('state_hover');
                    });
                }
            }
            
            this.__setUpScrolling();
            this.__setUpFirstLastVisibleItemIndex();
        },
        
        /**
         * @private
         */
        __setUpFirstLastVisibleItemIndex: function() {
            this.getModel().on('change', function() {
                this.__scrollable.update();
                this.__updateIndexes();
            }, this);
            this.on('_changeHasMoreItems', function() {
                this.__scrollable.update();
                this.__updateIndexes();
            }, this);
            this.__scrollableEl.on('scroll', this.__updateIndexes.bind(this));
            this.getListView().on('appear', this.__updateIndexes, this);
            this.getListView().on('resize', this.__updateIndexes, this);
        },
        
        /**
         * @private
         */
        __setUpScrolling: function() {
            if (this.getVisibleItemsCount()) {
                this.__dontUpdateIndexes = true;
            }
            var view = this.getListView();
            var model = this.getModel();
            
            croc.Object.listenProperties(
                this, 'visibleItemsCount',
                this.getListView(), 'shown',
                model, 'empty',
                function(count, shown, empty) {
                    if (shown && count && !empty) {
                        var el = this.__scrollableEl;
                        var height = view.getListElements().eq(0).outerHeight(true) * count;
                        if (el.css('boxSizing') === 'border-box') {
                            height += el.outerHeight() - el.height();
                        }
                        el.css('maxHeight', height);
                        if (Stm.env.ldevice !== 'desktop' && el.height() <= height + 1) {
                            el.css('maxHeight', el.height() - 2);
                        }
                        this.__dontUpdateIndexes = false;
                        this.__updateIndexes();
                        view.onResize();
                    }
                }, this);
            
            if (!model.getEmpty()) {
                this.__updateIndexes();
            }
            
            this.getModel().on('changeEmpty', function(empty) {
                if (empty) {
                    this.__scrollableEl.scrollTop(0);
                }
            }, this);
        },
        
        /**
         * @private
         */
        __updateIndexes: function() {
            if (this.__dontUpdateIndexes) {
                return;
            }
            
            var gap = 5;
            var view = this.getListView();
            var elements = view.getListElements();
            if (!view.isVisible() || elements.length === 0) {
                return;
            }
            
            var height = view.getElement().height();
            var scrollOffset = elements[0].offsetTop + this.__scrollableEl.scrollTop();
            
            function getElMiddle(el) {
                return el[0].offsetTop - scrollOffset + Math.min(height, el.outerHeight()) / 2;
            }
            
            var firstIndex = croc.utils.arrBinarySearch(elements, function(el, index) {
                return getElMiddle($(el));
            }, {returnRightIndex: true});
            this._setFirstVisibleItemIndex(firstIndex);
            
            var lastIndex = croc.utils.arrBinarySearch(elements, function(el, index) {
                return getElMiddle($(el)) - height;
            }, {firstIndex: firstIndex, returnLeftIndex: true});
            this._setLastVisibleItemIndex(lastIndex === -1 ? elements.length - 1 : lastIndex);
        }
    }
});