/**
 * api-ru Менеджер управляет видимостью элементов списка {@link croc.ui.list.View}
 * api-en Manager controls the visibility of list items {@link croc.ui.list.View}
 */
croc.Class.define('croc.cmp.list.manager.Abstract', {
    type: 'abstract',
    extend: croc.Object,
    
    properties: {
        /**
         * api-ru Если количество невидимых элементов впереди видимых становится меньше этого числа, то у модели запрашиваются
         *        следующие элементы через метод {@link croc.data.IStreamList#prepareMore}
         * api-en If amount of invisible elements, ahead of visible, becomes smaller this number, model is requested 
         *        the subsequent elements through the method {@link croc.data.IStreamList#prepareMore}
         * @type {number}
         */
        buffer: {
            type: 'number',
            option: true
        },
        
        /**
         * api-ru Индекс первого видимого элемента
         * api-en Index of first visible element.
         * @type {number}
         */
        firstVisibleIndex: {
            _setter: null,
            value: 0,
            event: true
        },
        
        /**
         * api-ru Соответствующее свойство модели
         * api-en Relevant feature of model.
         * @type {boolean}
         */
        hasMoreItems: {
            _getter: null,
            __setter: null,
            value: false,
            event: true
        },
        
        /**
         * api-ru Есть ли следующие скрытые элементы
         * api-en Are there any next hidden elements?
         * @type {boolean}
         */
        hasNextItems: {
            _setter: null,
            value: false,
            event: true
        },
        
        /**
         * api-ru Есть ли предыдущие скрытые элементы
         * api-en Are there any previous hidden elements?
         * @type {boolean}
         */
        hasPrevItems: {
            _setter: null,
            value: false,
            event: true
        },
        
        /**
         * api-ru Индекс последнего видимого элемента
         * api-en Index of last visible element
         * @type {number}
         */
        lastVisibleIndex: {
            field: '__lastVisibleIndex',
            _setter: null,
            event: true
        },
        
        /**
         * api-ru Количество одновременно видимых элементов.
         * api-ru Сейчас работает только для сокрытия по высоте!
         * api-en Number of visible items at the same time.
         * api-en Now only work for hiding in height. 
         * @type {number}
         */
        visibleCount: {
            field: '__visibleCount',
            type: 'number',
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * api-ru Если есть скрытые предыдущие элементы, то добавляет элементу указанный класс.
         * api-en If there are hidden previous elements, then add pointed class to element.
         * @type {string}
         */
        hasPrevItemsClass: {},
        
        /**
         * api-ru Если есть скрытые следующие элементы, то добавляет элементу указанный класс.
         * api-en If there are hidden next elements, then add pointed class to element.
         * @type {string}
         */
        hasNextItemsClass: {},
        
        itemsSelector: '>*',
        
        model: {},
        
        selection: {},
        
        partialRendering: {},
        
        /**
         * @type {boolean}
         */
        selectedItemGap: false
    },
    
    construct: function(options) {
        croc.cmp.list.manager.Abstract.superclass.construct.apply(this, arguments);
        
        this.__hasPrevItemsClass = options.hasPrevItemsClass;
        this.__hasNextItemsClass = options.hasNextItemsClass;
        this.__selectedItemGap = options.selectedItemGap;
        this.__lastVisibleIndex = this.__visibleCount - 1;
        this.__sourceModel = croc.data.chain.From.resolve(options.model);
        
        this.__model = this.__sourceModel;
        
        var model = this.__model;
        
        if (this.getBuffer() !== null && options.partialRendering) {
            model = this.__model = this.__model.chain(croc.data.chain.Buffer, {
                buffer: this.getBuffer()
            });
        }
        
        //has next/prev items
        croc.Object.multiBind(
            this, 'firstVisibleIndex',
            model, 'length',
            this, '_hasPrevItems',
            function(index, length) {
                return length > 0 && index > 0;
            }, this);
        
        croc.Object.multiBind(
            this, 'lastVisibleIndex',
            this, '_hasMoreItems',
            model, 'length',
            this, '_hasNextItems',
            function(index, hasMore, length) {
                return hasMore || (length > 0 && index < length - 1);
            }, this);
        
        var promise = this.__model.lookup('croc.data.chain.IPromise');
        if (promise) {
            promise.bind('hasMoreItems', this, '__hasMoreItems');
        }
        
        //buffering
        var buffer = model.lookup('croc.data.chain.IBuffer');
        if (this.getBuffer() !== null && buffer) {
            var stream = model.lookup('croc.data.chain.IStream');
            this.listenProperty('lastVisibleIndex', function(index) {
                if (model.getLength() > 0 && (!stream || !stream.getLoading()) && this._getHasMoreItems() &&
                    model.getLength() - index - 1 < this.getBuffer()) {
                    buffer.needMore();
                }
            }, this);
        }
    },
    
    members: {
        /**
         * api-ru Вычислить количество видимых в данный момент элементов
         * api-en Calculate number of visible elements at this moment.
         * @returns {number}
         */
        calcVisibleCount: function() {
            return this.getLastVisibleIndex() - this.getFirstVisibleIndex() + 1;
        },
        
        /**
         * @returns {jQuery}
         */
        getContainer: function() {
            return this.__container;
        },
        
        getElement: function(item) {
            if (item && item instanceof jQuery) {
                return item;
            }
            return this.getElements().eq(this.getItemIndex(item));
        },
        
        /**
         * todo optimize
         * @returns {jQuery}
         */
        getElements: function() {
            return this.__container.find(this._options.itemsSelector);
        },
        
        getItem: function(item) {
            if (typeof item === 'number') {
                return this.__model.getItems()[item >= 0 ? item : this.__model.getLength() + item];
            }
            if (item instanceof jQuery) {
                return this.__model.getItems()[this.getElements().index(item)];
            }
            return item;
        },
        
        getItemIndex: function(item) {
            if (typeof item === 'number') {
                return item >= 0 ? item : this.__model.getLength() + item;
            }
            if (item instanceof jQuery) {
                item = this.getItem(item);
            }
            return this.__sourceModel.getItems().indexOf(item);
        },
        
        getItemsSelector: function() {
            return this._options.itemsSelector;
        },
        
        /**
         * api-ru Модель представления
         * api-en View model
         * @returns {croc.data.chain.IList}
         */
        getRendererModel: function() {
            return this.__model;
        },
        
        /**
         * api-ru Модель
         * api-en Model
         * @returns {croc.data.chain.IList}
         */
        getSourceModel: function() {
            return this.__sourceModel;
        },
        
        /**
         * api-ru Возвращает модели
         * api-en Returns models
         * @returns {Array.<Object>}
         */
        getVisibleItems: function() {
            return this.__sourceModel.getItems().slice(this.getFirstVisibleIndex(), this.getLastVisibleIndex() + 1);
        },
        
        /**
         * api-ru Перейти к элементу с индексом (показать его первым)
         * api-en Move to element with index (show it first).
         * @param {number} index
         */
        goToItem: function(index) { throw 'abstract!'; },
        
        /**
         * api-ry Инициализация менеджера элементом
         * api-en Manager initialization by element.
         * @param {jQuery} container
         */
        initContainer: function(container) {
            this.__container = container;
            this.__setUpClasses();
        },
        
        /**
         * api-ru Показать следующую страницу (считается, что на странице показано visibleCount элементов)
         * api-en Show next page (it considers, that it shows on page visibleCount elements)
         */
        nextPage: function() {
            this.goToItem(this.getFirstVisibleIndex() + this.__visibleCount);
        },
        
        /**
         * api-ru Показать предыдущую страницу (считается, что на странице показано visibleCount элементов)
         * api-en Show previous page (it considers, that it shows on page visibleCount elements)
         */
        prevPage: function() {
            this.goToItem(this.getFirstVisibleIndex() - this.__visibleCount);
        },
        
        /**
         * api-ru Показать переданный элемент
         * api-en Show sent element.
         * @param {croc.ui.Widget|jQuery|number|Object} item
         */
        showItem: function(item) {
            var index = this.getItemIndex(item);
            if (index !== -1) {
                var firstIndex = this.getFirstVisibleIndex();
                var lastIndex = this.getLastVisibleIndex();
                if (this.__selectedItemGap ? index <= firstIndex : index < firstIndex) {
                    this.goToItem(this.__selectedItemGap ? index - 1 : index);
                }
                else if (this.__selectedItemGap ? index >= lastIndex : index > lastIndex) {
                    this.goToItem(index - this.calcVisibleCount() + (this.__selectedItemGap ? 2 : 1));
                    // api-ru todo научить работать с элементами списка разной высоты
                    // api-en todo teach to work with elements of list with different height
                    while (this.__selectedItemGap ?
                    index >= this.getLastVisibleIndex() :
                    index > this.getLastVisibleIndex()) {
                        var setIndex = this.getFirstVisibleIndex() + 1;
                        this.goToItem(setIndex);
                        if (setIndex !== this.getFirstVisibleIndex()) {
                            break;
                        }
                    }
                }
            }
        },
        
        /**
         * @private
         */
        __setUpClasses: function() {
            if (this.__hasPrevItemsClass) {
                this.listenProperty('hasPrevItems', function(value) {
                    this.__container.toggleClass(this.__hasPrevItemsClass, value);
                }, this);
            }
            if (this.__hasNextItemsClass) {
                this.listenProperty('hasNextItems', function(value) {
                    this.__container.toggleClass(this.__hasNextItemsClass, value);
                }, this);
            }
        }
    }
});