/**
 * Отображение оригинального массива
 */
croc.Class.define('croc.data.MappedArray', {
    extend: croc.data.ObservableArray,
    implement: [
        croc.data.ISearchableList,
        croc.data.IStreamList
    ],
    
    events: {
        /**
         * ошибка при получении элементов
         */
        error: null
    },
    
    properties: {
        /**
         * Связан ли отображаемый массив с оригинальным в реальном времени
         */
        bound: {
            type: 'boolean',
            value: true,
            event: true
        },
        
        /**
         * элементы, которые нужно исключить из коллекции
         * @type {Array}
         */
        excludes: {
            field: '__excludes',
            type: 'array',
            transform: function(value) {
                return value && !value.length ? null : value;
            },
            apply: function() {
                this.doMapping();
            }
        },
        
        /**
         * Функция фильтрации элементов массива
         * @type {function(*, number):boolean}
         */
        filterFn: {
            type: 'function',
            field: '__filterFn',
            apply: function() {
                this.doMapping();
            },
            option: true
        },
        
        /**
         * Есть ли ещё неподгруженные элементы
         * @type {boolean}
         */
        hasMoreItems: {
            type: 'boolean',
            value: false,
            __setter: null,
            event: true
        },
        
        /**
         * Максимальное количество элементов, которые могут присутствовать в результирующем массиве
         * @type {number}
         */
        limit: {
            type: 'number',
            field: '__maxCount',
            apply: function() {
                this.doMapping();
            },
            option: true
        },
        
        /**
         * Идёт ли в данный момент подгрузка элементов
         * @type {boolean}
         */
        loading: {
            value: false,
            __setter: null,
            event: true
        },
        
        /**
         * строка поиска
         * @type {String}
         */
        searchString: {
            type: 'string',
            apply: function(value) {
                this.__searchRegexp = value && new RegExp(croc.utils.strEscapeRegexp(value), 'i');
                this.doMapping();
            },
            event: true
        }
    },
    
    options: {
        /**
         * Функция отображения
         * @type {function(*, number):*}
         */
        mapper: {
            type: 'function'
        },
        
        /**
         * Оригинальный массив
         * @type {array|croc.data.IObservableList}
         */
        original: {
            type: ['array', 'croc.data.IObservableList']
        },
        
        /**
         * Обратить отображаемый массив
         * @type {boolean}
         */
        reverse: false,
        
        /**
         * Функция, которая возвращает части элементов массива, по которым возможен поиск
         * @type {function(*):Array}
         */
        searchableItemPartsFn: {
            type: 'function',
            value: function(item) {
                return Array.isArray(item) ? item : typeof item === 'object' ? croc.utils.objValues(item) : [item];
            }
        }
    },
    
    construct: function(options) {
        this.__reverse = options.reverse;
        this.__searchableItemPartsFn = options.searchableItemPartsFn;
        this.__mapper = options.mapper;
        
        var original = options.original || [];
        if (croc.Interface.check(original, 'croc.data.IObservableList')) {
            this.__observableArray = original;
            this.__rawArray = original.cloneRawArray();
            var disposer = new croc.util.Disposer();
            
            this.listenProperty('bound', function(bound) {
                if (bound) {
                    disposer.addListener(original, 'change', function() {
                        this.__rawArray = original.cloneRawArray();
                        this.doMapping();
                    }, this);
                    
                    if (!this.__mapper) {
                        disposer.addListener(original, 'updateItem', function(item) {
                            this.onUpdateItem(item);
                        }, this);
                    }
                    
                    if (croc.Interface.check(original, 'croc.data.IStreamList')) {
                        disposer.addBinding(original, 'loading', this, '__loading');
                        disposer.addBinding(original, 'hasMoreItems', this, '__hasMoreItems');
                    }
                }
                else {
                    disposer.disposeAll();
                }
            });
        }
        else {
            this.__rawArray = original;
        }
        
        options.original = this.__getMappedArray().concat();
        if (options.original === this.__rawArray) {
            options.original = options.original.concat();
        }
        
        croc.data.MappedArray.superclass.construct.apply(this, arguments);
    },
    
    members: {
        
        /**
         * Провести отображение элементов
         */
        doMapping: function() {
            var arr = this.__getMappedArray();
            if (arr !== this.getArray()) {
                this.replaceAll(arr);
            }
        },
        
        /**
         * Количество элементов, которые единовременно подгружаются в поток по-умолчанию
         * @type {number}
         */
        getDefaultCount: function() {
            return null;
        },
        
        /**
         * Оригинальный массив
         * @returns {Array}
         */
        getOriginalArray: function() {
            return this.__rawArray;
        },
        
        /**
         * Возвращает индекс элемента ещё не полученного в поток, если его возможно получить. Иначе возвращает null.
         * @param item
         * @returns {number}
         */
        indexInStream: function(item) {
            return null;
        },
        
        /**
         * Пометить модель неактуальной. Если removeElements===false, то элементы будут удалены при следующей подгрузке
         * новых элементов
         * @param {boolean} [removeElements=true]
         */
        invalidateElements: function(removeElements) {
            if (this.__observableArray) {
                this.__observableArray.invalidateElements(removeElements);
            }
            else if (removeElements) {
                this.removeAll();
            }
        },
        
        /**
         * Актуальна ли модель
         * @returns {boolean}
         */
        isActualElements: function() {
            return this.__observableArray ? this.__observableArray.isActualElements() : true;
        },
        
        /**
         * Есть ли гарантия, что поток пополняется синхронно
         * @returns {boolean}
         */
        isSync: function() {
            return this.__observableArray ? this.__observableArray.isSync() : false;
        },
        
        /**
         * Если элементы ещё не подгружены, то подгружает их
         * в данный момент работает последовательно
         * @param {number} [count=undefined]
         */
        prepareMore: function(count) {
            if (this.__observableArray) {
                this.__observableArray.prepareMore(count);
            }
        },
        
        /**
         * Установить оригинальный массив. Также производит отображение через {@link #doMapping}.
         * @param {Array} arr
         * @param {boolean} [checkEquality=false] проверить старый и новый массивы на совпадение
         */
        setOriginalArray: function(arr, checkEquality) {
            if (!checkEquality || !croc.utils.arrEqual(this.__rawArray, arr)) {
                this.__rawArray = arr;
                this.doMapping();
            }
        },
        
        /**
         * @param item
         * @returns {boolean}
         * @private
         */
        __checkItemForRegexp: function(item) {
            return this.__searchableItemPartsFn(item).some(function(part) {
                return (!!part || part === 0) && this.__searchRegexp.test(part.toString());
            }, this);
        },
        
        /**
         * @returns {Array}
         * @private
         */
        __getMappedArray: function() {
            var arr;
            var rawArray = this.__reverse ? this.__rawArray.concat().reverse() : this.__rawArray;
            
            if (!this.__filterFn && !this.__excludes && !this.__searchRegexp) {
                arr = this.__maxCount ? rawArray.slice(0, this.__maxCount) : this.__rawArray;
            }
            else {
                arr = rawArray.filter(function(item, i) {
                    return (!this.__maxCount || arr.length < this.__maxCount) &&
                        (!this.__filterFn || this.__filterFn(item, i)) &&
                        (!this.__searchRegexp || this.__checkItemForRegexp(item)) &&
                        (!this.__excludes || !_.find(this.__excludes, _.partial(croc.utils.objEqual, item)));
                }, this);
            }
            
            return this.__mapper ? arr.map(this.__mapper) : arr;
        }
    }
});