/**
 * Принимает произвольный массив или ObservableArray в original и проксирует его в IStreamList (подгружает его элементы
 * порциями по limit)
 */
croc.Class.define('croc.data.StreamingProxy', {
    extend: croc.data.ObservableArray,
    implement: croc.data.IStreamList,
    
    events: {
        /**
         *
         */
        error: null
    },
    
    properties: {
        /**
         * Есть ли ещё неподгруженные элементы
         * @type {boolean}
         */
        hasMoreItems: {
            type: 'boolean',
            __setter: null,
            event: true
        },
        
        /**
         * Идёт ли в данный момент подгрузка элементов
         * @type {boolean}
         */
        loading: {
            __setter: null,
            event: true
        }
    },
    
    options: {
        /**
         * @type {boolean}
         */
        autoLoadRemoteItems: {
            value: true
        },
        
        /**
         * Оригинальный массив, который будет проксироваться в поток
         * @type {Array|croc.data.IObservableList}
         */
        original: {
            type: ['array', 'croc.data.IObservableList'],
            required: true
        },
        
        /**
         * Количество единовременно подгружаемых элементов
         * @type {number}
         */
        limit: {
            type: 'number',
            value: 10
        }
    },
    
    construct: function(options) {
        var disposer = this._getDisposer();
        
        if (Array.isArray(options.original)) {
            options.original = new croc.data.ObservableArray({original: options.original});
        }
        this.__rawArray = options.original;
        this.__limit = options.limit;
        options.original = this.__rawArray.getArray().slice(0, this.__limit);
        
        croc.data.StreamingProxy.superclass.__construct__.apply(this, arguments);
        
        var isStream = croc.Interface.check(this.__rawArray, 'croc.data.IStreamList');
        var observable = croc.Object.createModel({
            hasMoreItems: false,
            loading: false
        });
        
        if (isStream) {
            disposer.addBinding(this.__rawArray, 'hasMoreItems', observable, 'hasMoreItems');
            disposer.addBinding(this.__rawArray, 'loading', observable, 'loading');
            disposer.addListener(this.__rawArray, 'error', function() {
                this.fireEvent.apply(this, arguments);
            }, this);
        }
        
        disposer.addCallbacks(
            croc.Object.multiBind(
                this, 'length',
                this.__rawArray, 'length',
                observable, 'hasMoreItems',
                this, '__hasMoreItems',
                function(myLength, rawLength, hasMoreItems) {
                    return myLength < rawLength || hasMoreItems;
                }),
            croc.Object.multiBind(
                this, 'length',
                this.__rawArray, 'length',
                observable, 'loading',
                this, '__loading',
                function(myLength, rawLength, loading) {
                    return myLength === rawLength && loading;
                })
        );
        
        disposer.addListener(this.__rawArray, 'change', function(index, remove, insert) {
            var length = this.getLength();
            if (index === length && this.__appendOnLoad) {
                this.prepareMore();
            }
            else if (index < Math.max(length, this.__limit)) {
                var maxLength = this.__limit * Math.max(
                        Math.ceil((length - Math.min(remove.length, length - index)) / this.__limit),
                        1);
                
                if (index >= maxLength) {
                    this.splice(maxLength, length - maxLength);
                }
                else {
                    var tailLength = maxLength - index;
                    var tail = insert.length >= tailLength ?
                        insert.slice(0, tailLength) :
                        insert.concat(
                            this.getArray().slice(index + remove.length, maxLength + remove.length - insert.length)
                        );
                    this.splice.apply(this, [index, length - index + 1].concat(tail));
                }
            }
            this.__appendOnLoad = false;
        }, this);
        
        if (isStream) {
            this.listenChanges(function() {
                if (this.getLength() === this.__rawArray.getLength() && this.__rawArray.getHasMoreItems()) {
                    this.__appendOnLoad = true;
                }
                if (options.autoLoadRemoteItems && this.getLength() > 0 &&
                    this.getLength() > this.__rawArray.getLength() - this.__limit &&
                    this.__rawArray.getHasMoreItems() && !this.__rawArray.getLoading()) {
                    this.__rawArray.prepareMore();
                }
            }, this);
        }
    },
    
    members: {
        /**
         * Количество элементов, которые единовременно подгружаются в поток по-умолчанию
         * @type {number}
         */
        getDefaultCount: function() {
            return this.__limit;
        },
        
        /**
         * Алиас для getArray()[index]
         * @param {Number} index
         * @return {*}
         */
        getItem: function(index) {
            if (index >= this.getLength()) {
                this.prepareMore(Math.ceil((index + 1 - this.getLength()) / this.__limit) * this.__limit);
            }
            return croc.data.StreamingProxy.superclass.getItem.apply(this, arguments);
        },
        
        /**
         * Возвращает индекс элемента ещё не полученного в поток, если его возможно получить. Иначе возвращает null.
         * @param item
         * @returns {number}
         */
        indexInStream: function(item) {
            return this.__rawArray.indexOf(item);
        },
        
        /**
         * Пометить модель неактуальной. Если removeElements===false, то элементы будут удалены при следующей подгрузке
         * новых элементов
         * @param {boolean} [removeElements=true]
         */
        invalidateElements: function(removeElements) {
            if (removeElements) {
                this.__rawArray.removeAll();
            }
        },
        
        /**
         * Актуальна ли модель
         * @returns {boolean}
         */
        isActualElements: function() {
            return true;
        },
        
        /**
         * Есть ли гарантия, что поток пополняется синхронно
         * @returns {boolean}
         */
        isSync: function() {
            return !croc.Interface.check(this.__rawArray, 'croc.data.IStreamList') || !this.__rawArray.getLoading();
        },
        
        /**
         * Если элементы ещё не подгружены, то подгружает их
         * в данный момент работает последовательно
         * @param {number} [count=undefined]
         */
        prepareMore: function(count) {
            if (count === undefined) {
                count = this.__limit;
            }
            
            if (this.getHasMoreItems()) {
                this.append(this.__rawArray.getArray().slice(this.getLength(), this.getLength() + count));
            }
        }
    }
});
