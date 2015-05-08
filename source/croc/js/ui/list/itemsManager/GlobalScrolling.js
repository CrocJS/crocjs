croc.ns('croc.ui.list');

/**
 * Менеджер позволяет прокручивать элементы списка
 */
croc.Class.define('croc.ui.list.itemsManager.GlobalScrolling', {
    extend: croc.ui.list.itemsManager.Abstract,
    
    members: {
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
            
            $(window).scrollTop(this.getListView().getListItemElement(index).offset().top());
            this.__updateIndexes();
        },
        
        /**
         * Инициализация менеджера представлением
         * @param {croc.ui.list.View} listView
         * @param {boolean} hasHasMoreItemsMarker
         */
        initListView: function(listView, hasHasMoreItemsMarker) {
            /**
             * @type {boolean}
             * @private
             */
            this.__moreItemsMarker = hasHasMoreItemsMarker;
            
            croc.ui.list.itemsManager.Scrolling.superclass.initListView.apply(this, arguments);
            this.__setUpFirstLastVisibleItemIndex();
        },
        
        /**
         * @private
         */
        __setUpFirstLastVisibleItemIndex: function() {
            this.getModel().on('change', this.__updateIndexes, this);
            this.on('_changeHasMoreItems', this.__updateIndexes, this);
            this.getListView().on('appear', this.__updateIndexes, this);
            this.getListView().on('resize', this.__updateIndexes, this);
            this._getDisposer().addListener($(window), 'resize', this.__updateIndexes, this);
            this._getDisposer().addCallback(
                croc.utils.domListenScrolling(this.getListView().getElement(),
                    _.throttle(this.disposableFunc(this.__updateIndexes, this), 15)));
        },
        
        /**
         * @private
         */
        __updateIndexes: function() {
            var view = this.getListView();
            var elements = view.getListElements();
            if (!view.isVisible() || elements.length === 0) {
                return;
            }
            
            var winEl = $(window);
            var height = winEl.height();
            var scrollOffset = winEl.scrollTop();
            
            function getElMiddle(el) {
                return el.offset().top - scrollOffset + Math.min(height, el.outerHeight()) / 2;
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