/**
 * Менеджер управляет видимостью элементов списка {@link croc.ui.list.View}
 */
croc.Class.define('croc.cmp.list.manager.Abstract', {
    type: 'abstract',
    extend: croc.Object,
    
    properties: {
        /**
         * Если количество невидимых элементов впереди видимых становится меньше этого числа, то у модели запрашиваются
         * следующие элементы через метод {@link croc.data.IStreamList#prepareMore}
         * @type {number}
         */
        buffer: {
            type: 'number',
            option: true
        },
        
        /**
         * Индекс первого видимого элемента
         * @type {number}
         */
        firstVisibleIndex: {
            _setter: null,
            value: 0,
            event: true
        },
        
        /**
         * Соответствующее свойство модели
         * @type {boolean}
         */
        hasMoreItems: {
            _getter: null,
            __setter: null,
            value: false,
            event: true
        },
        
        /**
         * Есть ли следующие скрытые элементы
         * @type {boolean}
         */
        hasNextItems: {
            _setter: null,
            value: false,
            event: true
        },
        
        /**
         * Есть ли предыдущие скрытые элементы
         * @type {boolean}
         */
        hasPrevItems: {
            _setter: null,
            value: false,
            event: true
        },
        
        /**
         * Индекс последнего видимого элемента
         * @type {number}
         */
        lastVisibleIndex: {
            field: '__lastVisibleIndex',
            _setter: null,
            event: true
        },
        
        /**
         * Количество одновременно видимых элементов.
         * Сейчас работает только для сокрытия по высоте!
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
         * Если есть скрытые предыдущие элементы, то добавляет элементу указанный
         * класс.
         * @type {string}
         */
        hasPrevItemsClass: {},
        
        /**
         * Если есть скрытые следующие элементы, то добавляет элементу указанный
         * класс.
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
        croc.cmp.list.manager.Abstract.superclass.__construct__.apply(this, arguments);
        
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
         * Вычислить количество видимых в данный момент элементов
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
                return this.__model.getItems()[item];
            }
            if (item instanceof jQuery) {
                return this.__model.getItems()[this.getElements().index(item)];
            }
            return item;
        },
        
        getItemIndex: function(item) {
            if (typeof item === 'number') {
                return item;
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
         * Модель представления
         * @returns {croc.data.chain.IList}
         */
        getRendererModel: function() {
            return this.__model;
        },
        
        /**
         * Модель
         * @returns {croc.data.chain.IList}
         */
        getSourceModel: function() {
            return this.__sourceModel;
        },
        
        /**
         * Возвращает модели
         * @returns {Array.<Object>}
         */
        getVisibleItems: function() {
            return this.__sourceModel.getItems().slice(this.getFirstVisibleIndex(), this.getLastVisibleIndex() + 1);
        },
        
        /**
         * Перейти к элементу с индексом (показать его первым)
         * @param {number} index
         */
        goToItem: function(index) { throw 'abstract!'; },
        
        /**
         * Инициализация менеджера элементом
         * @param {jQuery} container
         */
        initContainer: function(container) {
            this.__container = container;
            this.__setUpClasses();
        },
        
        /**
         * Показать следующую страницу (считается, что на странице показано visibleCount элементов)
         */
        nextPage: function() {
            this.goToItem(this.getFirstVisibleIndex() + this.__visibleCount);
        },
        
        /**
         * Показать предыдущую страницу (считается, что на странице показано visibleCount элементов)
         */
        prevPage: function() {
            this.goToItem(this.getFirstVisibleIndex() - this.__visibleCount);
        },
        
        /**
         * Показать переданный элемент
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
                    //todo научить работать с элементами списка разной высоты
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