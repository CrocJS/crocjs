/**
 * Менеджер управляет видимостью элементов списка {@link croc.ui.list.View}
 */
croc.Class.define('croc.ui.list.itemsManager.Abstract', {
    type: 'abstract',
    extend: croc.Object,
    
    properties: {
        /**
         * Индекс первого видимого элемента
         * @type {number}
         */
        firstVisibleItemIndex: {
            _setter: null,
            value: 0,
            event: true
        },
        
        /**
         * Всегда показывать новые выделенные элементы
         * @type {boolean}
         */
        goToSelectedItem: {
            field: '__goToSelectedItem',
            value: true,
            apply: '__applyGoToSelectedItem',
            option: true
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
         * Есть ли следующие скрытие элементы
         * @type {boolean}
         */
        hasNextItems: {
            _setter: null,
            value: false,
            event: true
        },
        
        /**
         * Есть ли предыдущие скрытие элементы
         * @type {boolean}
         */
        hasPrevItems: {
            _setter: null,
            value: false,
            event: true
        },
        
        /**
         * Если количество невидимых элементов впереди видимых становится меньше этого числа, то у модели запрашиваются
         * следующие элементы через метод {@link croc.data.IStreamList#prepareMore}
         * @type {number}
         */
        itemsBuffer: {
            type: 'number',
            option: true
        },
        
        /**
         * Индекс последнего видимого элемента
         * @type {number}
         */
        lastVisibleItemIndex: {
            field: '__lastVisibleItemIndex',
            _setter: null,
            event: true
        },
        
        /**
         * Количество одновременно видимых элементов.
         * Сейчас работает только для сокрытия по высоте!
         * @type {number}
         */
        visibleItemsCount: {
            field: '__visibleItemsCount',
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
        
        /**
         * @type {boolean}
         */
        selectedItemGap: false
    },
    
    construct: function(options) {
        croc.ui.list.itemsManager.Abstract.superclass.__construct__.apply(this, arguments);
        
        this.__hasPrevItemsClass = options.hasPrevItemsClass;
        this.__hasNextItemsClass = options.hasNextItemsClass;
        this.__selectedItemGap = options.selectedItemGap;
        this.__lastVisibleItemIndex = this.__visibleItemsCount - 1;
    },
    
    members: {
        /**
         * Вычислить количество видимых в данный момент элементов
         * @returns {number}
         */
        calcVisibleItemsCount: function() {
            return this.getLastVisibleItemIndex() - this.getFirstVisibleItemIndex() + 1;
        },
        
        /**
         * Ассоциированное с менеджером представление
         * @returns {croc.ui.list.View}
         */
        getListView: function() {
            return this.__view;
        },
        
        /**
         * Модель представления
         * @returns {croc.data.IObservableList|croc.data.IStreamList}
         */
        getModel: function() {
            return this.__model;
        },
        
        /**
         * Возвращает модели
         * @returns {Array.<Object>}
         */
        getVisibleItems: function() {
            return this.getListView().getRenderModel().getArray().slice(this.getFirstVisibleItemIndex(),
                this.getLastVisibleItemIndex() + 1);
        },
        
        /**
         * Перейти к элементу с индексом (показать его первым)
         * @param {number} index
         */
        goToItem: function(index) { throw 'abstract!'; },
        
        /**
         * Инициализация менеджера представлением
         * @param {croc.ui.list.View} listView
         * @param {boolean} hasHasMoreItemsMarker
         */
        initListView: function(listView, hasHasMoreItemsMarker) {
            if (this.__view) {
                throw new Error('ListView уже был инициализирован');
            }
            
            /**
             * @type {croc.ui.list.View}
             * @private
             */
            this.__view = listView;
            
            /**
             * @type {croc.data.IObservableList|croc.data.IStreamList}
             * @private
             */
            var model = this.__model = listView.getRenderModel();
            
            if (croc.Interface.check(model, 'croc.data.IStreamList')) {
                model.bind('hasMoreItems', this, '__hasMoreItems');
            }
            
            if (this.__view.isGrouped()) {
                throw 'not implemented!';
            }
            
            //has next/prev items
            croc.Object.multiBind(
                this, 'firstVisibleItemIndex',
                model, 'length',
                this, '_hasPrevItems',
                function(index, length) {
                    return length > 0 && index > 0;
                }, this);
            
            croc.Object.multiBind(
                this, 'lastVisibleItemIndex',
                this, '_hasMoreItems',
                model, 'length',
                this, '_hasNextItems',
                function(index, hasMore, length) {
                    return hasMore || (length > 0 && index < length - 1);
                }, this);
            
            //buffering
            if (this.getItemsBuffer() !== null && croc.Interface.check(model, 'croc.data.IStreamList')) {
                this.listenProperty('lastVisibleItemIndex', function(index) {
                    if (model.getLength() > 0 && !model.getLoading() && model.getHasMoreItems() &&
                        model.getLength() - index - 1 < this.getItemsBuffer()) {
                        model.prepareMore();
                    }
                }, this);
            }
            
            this.__setUpClasses();
            
            if (this.__goToSelectedItem) {
                this.__applyGoToSelectedItem(this.__goToSelectedItem, !this.__goToSelectedItem, true);
            }
        },
        
        /**
         * Показать следующую страницу (считается, что на странице показано visibleItemsCount элементов)
         */
        nextPage: function() {
            this.goToItem(this.getFirstVisibleItemIndex() + this.__visibleItemsCount);
        },
        
        /**
         * Показать предыдущую страницу (считается, что на странице показано visibleItemsCount элементов)
         */
        prevPage: function() {
            this.goToItem(this.getFirstVisibleItemIndex() - this.__visibleItemsCount);
        },
        
        /**
         * Показать переданный элемент
         * @param {croc.ui.Widget|jQuery|number|Object} item
         */
        showItem: function(item) {
            var index = this.__view.getListItemIndex(item);
            if (index !== -1) {
                var firstIndex = this.getFirstVisibleItemIndex();
                var lastIndex = this.getLastVisibleItemIndex();
                if (this.__selectedItemGap ? index <= firstIndex : index < firstIndex) {
                    this.goToItem(this.__selectedItemGap ? index - 1 : index);
                }
                else if (this.__selectedItemGap ? index >= lastIndex : index > lastIndex) {
                    this.goToItem(index - this.calcVisibleItemsCount() + (this.__selectedItemGap ? 2 : 1));
                    //todo научить работать с элементами списка разной высоты
                    while (this.__selectedItemGap ?
                    index >= this.getLastVisibleItemIndex() :
                    index > this.getLastVisibleItemIndex()) {
                        var setIndex = this.getFirstVisibleItemIndex() + 1;
                        this.goToItem(setIndex);
                        if (setIndex !== this.getFirstVisibleItemIndex()) {
                            break;
                        }
                    }
                }
            }
        },
        
        /**
         * @param value
         * @param [old]
         * @param [runFirstTime]
         * @private
         */
        __applyGoToSelectedItem: function(value, old, runFirstTime) {
            if (value) {
                var onChange = _.debounce(this.disposableFunc(function(index, remove, insert) {
                    if (insert.length) {
                        this.showItem(this.getListView().getListItemIndex(insert[0]));
                    }
                }, this), 0);
                var selection = this.__view.getSelection();
                
                this.__goToSelectedItemListener = selection.on('change', onChange);
                if (runFirstTime && !selection.getEmpty()) {
                    onChange(0, [], selection.getArray());
                }
            }
            else if (this.__goToSelectedItemListener) {
                this.__goToSelectedItemListener();
                this.__goToSelectedItemListener = null;
            }
        },
        
        /**
         * @private
         */
        __setUpClasses: function() {
            if (this.__hasPrevItemsClass) {
                this.listenProperty('hasPrevItems', function(value) {
                    this.__view.getElement().toggleClass(this.__hasPrevItemsClass, value);
                }, this);
            }
            if (this.__hasNextItemsClass) {
                this.listenProperty('hasNextItems', function(value) {
                    this.__view.getElement().toggleClass(this.__hasNextItemsClass, value);
                }, this);
            }
        }
    }
});