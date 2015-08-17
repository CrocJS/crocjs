/**
 * api-ru Менеджер позволяет прокручивать элементы списка. Если используется свойство visibleCount, то очень важно, чтобы
 *        высота каждого элемента была одинаковой! (вплоть до пиксела)
 * api-en Manager allows to scroll list of elements. If visibleCount property is used, then it's very important, that height
 *        of every element were the same! (up to pixel)
 */
croc.Class.define('croc.cmp.list.manager.Scrolling', {
    extend: croc.cmp.list.manager.Abstract,
    
    options: {
        /**
         * api-ru Прокручивать список дискретно
         * api-en Scroll list discretely.
         * @type {boolean}
         */
        discreteScrolling: true,
        
        /**
         * api-ru Если есть предыдущие невидимые элементы, показать соответствующий маркер (например, градиент)
         * api-en If there are previous visible elements, show corresponding marker (for example, gradient)
         * @type {boolean}
         */
        hasOverflowMarkers: false,
        
        /**
         * api-ru Скрывать маркеры при наведении мыши
         * api-en Hide markers by mouse-over.
         * @type {boolean}
         */
        hideOverflowMarkers: false,
        
        /**
         * api-ru Размер скроллбара
         * api-en Size of scrollbar.
         * @type {string}
         */
        scrollbarSize: {
            type: 'string',
            value: '1'
        },
        
        /**
         * api-ru Нужен ли скроллбар
         * api-en Do we need scrollbar.
         * @type {boolean}
         */
        scrollbarVisibility: {
            check: ['visible', 'hidden', 'abstract'],
            value: 'abstract'
        },
        
        /**
         * api-ru Шаг прокручивания списка в строках
         * api-en Step of scrolling the list in lines.
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
        
        croc.cmp.list.manager.Scrolling.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * @return {croc.ui.common.Scrollable}
         */
        getScrollable: function() {
            return this.__scrollable;
        },
        
        /**
         * api-ru Перейти к элементу с индексом (показать его первым)
         * api-en Move to element with index (show it first).
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
         * api-ru Инициализация менеджера элементом
         * api-en Initialization of manager by element.
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
                '<div class="b-scrollable-marker b-scrollable-prev-marker"></div>' +
                '<div class="b-scrollable-marker b-scrollable-next-marker"></div>');
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
                
                // api-ru клик по маркерам приводит к клику по соответствующим элементам
                // api-en click on markers lead to click on relevant elements.
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
            //todo fix it
            var widget = croc.cmp.Widget.getClosestWidget(this.__container);
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
                    widget.checkResize();
                }
            }.bind(this);
            
            var deferredListener = this.debounce(listener);
            
            croc.Object.listenProperties(
                this, 'visibleCount',
                widget, 'shown',
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