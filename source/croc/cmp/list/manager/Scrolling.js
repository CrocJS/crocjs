/**
 * Менеджер позволяет прокручивать элементы списка. Если используется свойство visibleCount, то очень важно, чтобы
 * высота каждого элемента была одинаковой! (вплоть до пиксела)
 */
croc.Class.define('croc.cmp.list.manager.Scrolling', {
    extend: croc.cmp.list.manager.Abstract,
    
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
        hasOverflowMarkers: false,
        
        /**
         * Скрывать маркеры при наведении мыши
         * @type {boolean}
         */
        hideOverflowMarkers: false,
        
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
        if (options.hasOverflowMarkers) {
            options.hasPrevItemsClass = 'state_has-prev';
            options.hasNextItemsClass = 'state_has-next';
            options.selectedItemGap = true;
        }
        
        this.__hasOverflowMarkers = options.hasOverflowMarkers;
        this.__hideOverflowMarkers = options.hideOverflowMarkers;
        this.__scrollbarVisibility = options.scrollbarVisibility;
        this.__scrollbarSize = options.scrollbarSize;
        this.__discreteScrolling = options.discreteScrolling;
        
        croc.cmp.list.manager.Scrolling.superclass.__construct__.apply(this, arguments);
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
            var model = this.getRendererModel();
            if (model.getLength() === 0) {
                return;
            }
            index = this.getItemIndex(index);
            index = Math.min(model.getLength() - 1, Math.max(0, index));
            
            var elements = this.getElements();
            this.__scrollableEl.scrollTop(elements[index].offsetTop - elements[0].offsetTop);
            
            this.__updateIndexes();
        },
        
        /**
         * Инициализация менеджера элементом
         * @param {jQuery} container
         */
        initContainer: function(container) {
            croc.cmp.list.manager.Scrolling.superclass.initContainer.apply(this, arguments);
            
            this.__scrollable = new croc.cmp.common.Scrollable({
                el: container,
                visibility: this.__scrollbarVisibility,
                size: this.__scrollbarSize,
                discreteScrolling: this.__discreteScrolling,
                discreteScrollingItems: function() {
                    return this.getElements();
                }.bind(this)
            });
            this.__scrollableEl = this.__scrollable.getScrollableElement();
            
            if (this.__hasOverflowMarkers) {
                var markers = $('' +
                '<div class="g-scrollable-marker g-scrollable-prev-marker"></div>' +
                '<div class="g-scrollable-marker g-scrollable-next-marker"></div>');
                container.append(markers);
                
                if (this.__hideOverflowMarkers) {
                    container.on('mouseenter mouseleave', this.getItemsSelector(), function(e) {
                        var index = this.getItemIndex($(e.currentTarget));
                        if (index <= this.getFirstVisibleIndex()) {
                            markers.eq(0).toggleClass('state_hover', e.type === 'mouseenter');
                        }
                        if (index >= this.getLastVisibleIndex()) {
                            markers.eq(1).toggleClass('state_hover', e.type === 'mouseenter');
                        }
                    }.bind(this));
                    this.on('changeFirstVisibleIndex', function() {
                        markers.removeClass('state_hover');
                    });
                }
                
                //клик по маркерам приводит к клику по соответствующим элементам
                markers.eq(0).click(function() {
                    this.getElement(this.getFirstVisibleIndex()).click();
                }.bind(this));
                markers.eq(1).click(function() {
                    this.getElement(this.getLastVisibleIndex()).click();
                }.bind(this));
            }
            
            this.__setUpScrolling();
            this.__setUpBounds();
        },
        
        /**
         * @private
         */
        __setUpBounds: function() {
            this.getRendererModel().on('change', this.debounce(function() {
                this.__scrollable.update();
                this.__updateIndexes();
            }, this));
            this.on('_changeHasMoreItems', this.debounce(function() {
                this.__scrollable.update();
                this.__updateIndexes();
            }, this));
            this.__scrollableEl.on('scroll', this.__updateIndexes.bind(this));
            //this.getListView().on('appear', this.__updateIndexes, this);
            //this.getListView().on('resize', this.__updateIndexes, this);
        },
        
        /**
         * @private
         */
        __setUpScrolling: function() {
            if (this.getVisibleCount()) {
                this.__dontUpdateIndexes = true;
            }
            var model = this.getRendererModel();
            var observable = croc.Object.createModel({empty: true});
            model.bind('length', observable, 'empty', function(x) { return x === 0; });
            
            var listener = function(count, shown, empty) {
                if (shown && count && !empty) {
                    var el = this.__scrollableEl;
                    var height = this.getElements().eq(0).outerHeight(true) * count;
                    if (!height) {
                        deferredListener.apply(this, arguments);
                        return;
                    }
                    if (el.css('boxSizing') === 'border-box') {
                        height += el.outerHeight() - el.height();
                    }
                    el.css('maxHeight', height);
                    this.__dontUpdateIndexes = false;
                    this.__updateIndexes();
                    //view.onResize();
                }
            }.bind(this);
            
            var deferredListener = this.debounce(listener);
            
            croc.Object.listenProperties(
                this, 'visibleCount',
                //todo fix it
                croc.cmp.Widget.getClosestWidget(this.__container), 'shown',
                observable, 'empty',
                listener);
            
            if (!observable.getEmpty()) {
                this.__updateIndexes();
            }
            
            observable.on('changeEmpty', function(empty) {
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
            
            var elements = this.getElements();
            var container = this.getContainer();
            if (!this.getContainer().is(':visible') || elements.length === 0) {
                return;
            }
            
            var height = container.height();
            var scrollOffset = elements[0].offsetTop + this.__scrollableEl.scrollTop();
            
            function getElMiddle(el) {
                return el[0].offsetTop - scrollOffset + Math.min(height, el.outerHeight()) / 2;
            }
            
            var firstIndex = croc.utils.arrBinarySearch(elements, function(el, index) {
                return getElMiddle($(el));
            }, {returnRightIndex: true});
            this._setFirstVisibleIndex(firstIndex);
            
            var lastIndex = croc.utils.arrBinarySearch(elements, function(el, index) {
                return getElMiddle($(el)) - height;
            }, {firstIndex: firstIndex, returnLeftIndex: true});
            this._setLastVisibleIndex(lastIndex === -1 ? elements.length - 1 : lastIndex);
        }
    }
});