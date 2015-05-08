croc.Class.define('croc.data.chain.Array', {
    extend: croc.data.Model,
    implement: croc.data.chain.IStream,
    
    properties: {
        bound: {
            value: true,
            apply: function(value) {
                if (value) {
                    this.doMapping();
                }
            },
            option: true
        },
        
        /**
         * элементы, которые нужно исключить из коллекции
         * @type {Array}
         */
        excludes: {
            type: 'array',
            model: true,
            option: true
        },
        
        /**
         * Функция фильтрации элементов массива
         * @type {function(*, number):boolean}
         */
        filterFn: {
            type: 'function',
            model: true,
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
            model: true
        },
        
        length: {
            __setter: null,
            model: true
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
            model: true
        },
        
        /**
         * строка поиска
         * @type {String}
         */
        searchString: {
            type: 'string',
            model: true
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
        },
        
        source: {},
        
        buffer: {},
        
        target: {}
    },
    
    construct: function(options) {
        croc.data.chain.Array.superclass.construct.apply(this, arguments);
        
        if (!options.source) {
            options.source = [];
        }
        else if (croc.Interface.check(options.source, 'croc.data.chain.IStream')) {
            this.__stream = options.source;
            options.source = options.source.getTarget();
        }
        
        if (Array.isArray(options.source)) {
            this._model.set('source', options.source);
        }
        else {
            this._model.ref('source',
                typeof options.source === 'string' ? options.model.at(options.source) : options.model);
        }
        
        this.__target = !options.target ? this._model.at('items') :
            typeof options.target === 'string' ? options.model.at(options.target) : options.target;
        
        this._model.on('all', 'source', this.doMapping, this);
        this._model.on('all', 'excludes', this.doMapping, this);
        this._model.on('change', 'filterFn', this.doMapping, this);
        this._model.on('change', 'searchString', this.doMapping, this);
        this.doMapping();
        
        if (this._options.buffer) {
            this.__setUpBuffering();
        }
    },
    
    members: {
        /**
         * Провести отображение элементов
         */
        doMapping: function() {
            if (this.getBound()) {
                var arr = this.__getMappedArray();
                this.__setLength(arr.length);
                this.__target.setArrayDiff(arr);
            }
        },
        
        getTarget: function() {
            return this.__target;
        },
        
        /**
         * Количество элементов, которые единовременно подгружаются в поток по-умолчанию
         * @type {number}
         */
        getDefaultCount: function() {
            return this._options.buffer;
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
            if (this.__stream) {
                this.__stream.invalidateElements(removeElements);
            }
            else if (removeElements) {
                this.__target.remove(0, this.__target.get().length);
            }
        },
        
        /**
         * Актуальна ли модель
         * @returns {boolean}
         */
        isActualElements: function() {
            return this.__stream ? this.__stream.isActualElements() : true;
        },
        
        /**
         * Есть ли гарантия, что поток пополняется синхронно
         * @returns {boolean}
         */
        isSync: function() {
            return this.__stream ? this.__stream.isSync() : false;
        },
        
        /**
         * Если элементы ещё не подгружены, то подгружает их
         * @param {number} [count=undefined]
         */
        prepareMore: function(count) {
            if (count === undefined) {
                count = this._options.buffer;
            }
            if (count) {
                if (this.getLimit()) {
                    //todo 
                    this.setLimit(this.getLimit() + count);
                }
                else if (this.__stream) {
                    this.__stream.prepareMore(count);
                }
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
            var rawArray = this._model.get('source');
            if (this._options.reverse) {
                rawArray = rawArray.concat().reverse();
            }
            
            var filterFn = this.getFilterFn();
            var excludes = this.getExcludes();
            if (!filterFn && !excludes && !this.__searchRegexp) {
                arr = this.__maxCount ? rawArray.slice(0, this.__maxCount) : this.__rawArray;
            }
            else {
                var found = 0;
                arr = rawArray.filter(function(item, i) {
                    var result = (!this.__maxCount || found < this.__maxCount) &&
                        (!filterFn || filterFn(item, i)) &&
                        (!this.__searchRegexp || this.__checkItemForRegexp(item)) &&
                        (!excludes || !_.find(excludes, _.partial(croc.utils.objEqual, item)));
                    
                    if (result) {
                        ++found;
                    }
                    
                    return result;
                }, this);
            }
            
            if (this._options.mapper) {
                arr = arr.map(this._options.mapper);
            }
            return arr;
        },
        
        __setUpBuffering: function() {
            this.__maxCount = this._options.buffer;
            
            var observable = croc.Object.createModel({
                hasMoreItems: false,
                loading: false,
                sourceLength: this._model.get('source.length')
            });
            
            var disposer = this._getDisposer();
            if (this.__stream) {
                disposer.addBinding(this.__stream, 'hasMoreItems', observable, 'hasMoreItems');
                disposer.addBinding(this.__stream, 'loading', observable, 'loading');
                disposer.addListener(this.__stream, 'error', function() {
                    this.fireEvent.apply(this, arguments);
                }, this);
            }
            
            this._model.on('change', 'source.length', function(length) {
                observable.setSourceLength(length);
            }.bind(this));
            
            disposer.addCallbacks(
                croc.Object.multiBind(
                    this, 'length',
                    observable, 'sourceLength',
                    observable, 'hasMoreItems',
                    this, '__hasMoreItems',
                    function(myLength, rawLength, hasMoreItems) {
                        return myLength < rawLength || hasMoreItems;
                    }),
                croc.Object.multiBind(
                    this, 'length',
                    observable, 'sourceLength',
                    observable, 'loading',
                    this, '__loading',
                    function(myLength, rawLength, loading) {
                        return myLength === rawLength && loading;
                    })
            );
        }
    }
});