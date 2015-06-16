//+use bower:jquery-mousewheel

/**
 * Менеджер показывает элементы постранично
 */
croc.Class.define('croc.ui.list.itemsManager.Paging', {
    extend: croc.ui.list.itemsManager.Abstract,
    
    statics: {
        /**
         * @param {jQuery} item
         * @param {boolean} shown
         * @private
         */
        __setItemVisibility: function(item, shown) {
            var widget = croc.ui.Widget.getByElement(item);
            if (widget) {
                widget.setShown(shown);
            }
            else {
                croc.utils.domToggle(item, shown);
            }
        }
    },
    
    events: {
        /**
         * Вид страницы был изменён (в результате изменения общего количества элементов или смещения относительно начала)
         */
        changePageView: null
    },
    
    options: {
        /**
         * Если была запрошена следующая страница, но для неё ещё не были подгружены элементы, то после того как они будут
         * подгружены эта страница будет показана
         * @type {boolean}
         */
        goToJustLoadedPage: true,
        
        /**
         * Функция для сокрытия предыдущей страницы и показа следующей
         * @type {function(jQuery, jQuery, number, number, number, number)}
         */
        switchItemsFn: {
            type: 'function',
            value: function(hideElements, showElements, index, lastIndex, oldIndex, oldLastIndex) {
                hideElements.each(function(i, el) {
                    croc.ui.list.itemsManager.Paging.__setItemVisibility($(el), false);
                });
                showElements.each(function(i, el) {
                    croc.ui.list.itemsManager.Paging.__setItemVisibility($(el), true);
                });
            }
        },
        
        /**
         * Использовать колёсико мыши для переключения страниц
         * @type {boolean}
         */
        useMouseWheel: false
    },
    
    construct: function(options) {
        this.__useMouseWheel = options.useMouseWheel;
        this.__switchItemsFn = options.switchItemsFn;
        this.__goToJustLoadedPage = options.goToJustLoadedPage;
        
        croc.ui.list.itemsManager.Paging.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Номер текущей страницы
         * @returns {number}
         */
        getPageNumber: function() {
            return Math.floor(this.getFirstVisibleItemIndex() / this.getVisibleItemsCount()) || 0;
        },
        
        /**
         * Перейти к элементу с индексом (показать его первым)
         * @param {number} index
         * @param {boolean} [quick=false]
         */
        goToItem: function(index, quick) {
            var model = this.getModel();
            
            index = this.getListView().getListItemIndex(index);
            if (index >= model.getLength() && croc.Interface.check(model, 'croc.data.IStreamList') &&
                model.getHasMoreItems()) {
                model.prepareMore();
                if (this.__goToJustLoadedPage) {
                    this.__goToLoadedIndex = index;
                }
            }
            else {
                this.__goToLoadedIndex = null;
            }
            
            index = Math.min(
                (Math.ceil(model.getLength() / this.getVisibleItemsCount()) - 1) * this.getVisibleItemsCount(),
                Math.max(0, index));
            var lastIndex = Math.min(model.getLength() - 1, index + this.getVisibleItemsCount() - 1);
            
            var oldIndex = this.getFirstVisibleItemIndex();
            var oldLastIndex = this.getLastVisibleItemIndex();
            
            var elements = this.getListView().getListElements();
            
            if (quick) {
                elements.each(function(curIndex, el) {
                    croc.ui.list.itemsManager.Paging.__setItemVisibility($(el),
                        curIndex >= index && curIndex <= lastIndex);
                });
            }
            else {
                this.__switchItemsFn(elements.slice(oldIndex, oldLastIndex + 1), elements.slice(index, lastIndex + 1),
                    index, lastIndex, oldIndex, oldLastIndex);
            }
            
            this._setFirstVisibleItemIndex(index);
            this._setLastVisibleItemIndex(lastIndex);
            
            this.fireEvent('changePageView');
        },
        
        /**
         * Перейти к странице по номеру
         * @param {number} page
         */
        goToPage: function(page) {
            this.goToItem(page * this.getVisibleItemsCount());
        },
        
        /**
         * Инициализация менеджера представлением
         * @param {croc.ui.list.View} listView
         * @param {boolean} hasHasMoreItemsMarker
         */
        initListView: function(listView, hasHasMoreItemsMarker) {
            croc.ui.list.itemsManager.Paging.superclass.initListView.apply(this, arguments);
            
            var view = this.getListView();
            
            this.listenProperty('visibleItemsCount', function(count) {
                var max = this.getFirstVisibleItemIndex() + count;
                var lastIndex = 0;
                
                for (var index = this.getFirstVisibleItemIndex(), element;
                     element = view.getListItemElement(index); ++index) { // jshint ignore:line
                    
                    if (index < max) {
                        croc.ui.list.itemsManager.Paging.__setItemVisibility(element, false);
                        lastIndex = index;
                    }
                    else if (element.is(':visible')) {
                        croc.ui.list.itemsManager.Paging.__setItemVisibility(element, false);
                    }
                    else {
                        break;
                    }
                }
                
                this._setLastVisibleItemIndex(lastIndex);
                this.fireEvent('changePageView');
            }, this);
            
            this.getModel().on('change', _.debounce(function(index, remove, insert) {
                this.goToItem(this.getFirstVisibleItemIndex(), true);
                if (this.__goToLoadedIndex && insert.length > 0) {
                    this.goToItem(this.__goToLoadedIndex);
                }
            }.bind(this), 0));
            
            if (this.__useMouseWheel) {
                view.getElement().mousewheel(function(e, delta) {
                    if (delta !== 0) {
                        if (delta < 0) {
                            this.nextPage();
                        }
                        else {
                            this.prevPage();
                        }
                    }
                    return false;
                }.bind(this));
            }
        }
    }
});