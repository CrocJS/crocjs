/**
 * Модель получает все данные с контроллера один раз, а затем производит поиск по ним на клиенте
 */
croc.Class.define('croc.data.RemoteSearchableList', {
    extend: croc.data.MappedArray,
    implement: croc.data.IStreamList,
    
    events: {
        /**
         * @param code
         * @param message
         */
        failure: null
    },
    
    properties: {
        /**
         * Есть ли ещё неподгруженные элементы
         * @type {boolean}
         */
        hasMoreItems: {
            getter: function() {
                return false;
            },
            event: true
        },
        
        /**
         * Идёт ли в данный момент подгрузка элементов
         * @type {boolean}
         */
        loading: {
            getter: null,
            _setter: null,
            value: false,
            event: true
        }
    },
    
    options: {
        /**
         * Функция вызывается перед отправкой запроса на сервер
         * @type {function(Object)}
         */
        preRequestFn: {
            type: 'function'
        },
        
        /**
         * Трансформация полученных данных
         * @type {function(*):Array}
         */
        transformResponseFn: {
            type: 'function'
        },
        
        /**
         * Адрес контроллера
         * @type {string}
         */
        url: {
            type: 'string',
            required: true
        }
    },
    
    construct: function(options) {
        croc.data.RemoteSearchableList.superclass.__construct__.apply(this, arguments);
        
        this.__url = options.url;
        this.__preRequestFn = options.preRequestFn;
        this.__transformResponseFn = options.transformResponseFn;
        this.__isActual = false;
    },
    
    members: {
        /**
         * Количество элементов, которые единовременно подгружаются в поток по-умолчанию
         * @type {number}
         */
        getDefaultCount: function() {
            return null;
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
            if (removeElements) {
                this.removeAll();
            }
        },
        
        /**
         * Пометить неактуальными оригинальные нефильтрованные элементы
         */
        invalidateOriginalElements: function() {
            this.__isActual = false;
            
            if (this.__query) {
                this.__query.abort();
                this.__query = null;
                this._setLoading(false);
            }
            
            this.setOriginalArray([]);
        },
        
        /**
         * Актуальна ли модель
         * @returns {boolean}
         */
        isActualElements: function() {
            return this.__isActual;
        },
        
        /**
         * Есть ли гарантия, что поток пополняется синхронно
         * @returns {boolean}
         */
        isSync: function() {
            return false;
        },
        
        /**
         * Если элементы ещё не подгружены, то подгружает их
         * в данный момент работает последовательно
         * @param {number} [count=undefined]
         * @returns {$.Deferred}
         */
        prepareMore: function(count) {
            if (this.__isActual) {
                this.doMapping();
                return $.Deferred().resolve(this.getOriginalArray());
            }
            
            return (this.__query || this.__sendQuery())
                .then(function() {
                    return this.getOriginalArray();
                }.bind(this));
        },
        
        /**
         * Параметры запроса
         * @returns {Object}
         * @protected
         */
        _getParams: function() {
            return {};
        },
        
        /**
         * @private
         */
        __sendQuery: function() {
            var params = this._getParams();
            if (this.__preRequestFn) {
                this.__preRequestFn(params);
            }
            
            var processError = function(errcode, msg) {
                if (this.getOriginalArray().length > 0) {
                    this.setOriginalArray([]);
                }
                this.fireEvent('failure', errcode, msg);
            }.bind(this);
            
            this._setLoading(true);
            this.__query = stm.ajax({
                url: this.__url,
                data: params,
                forceCache: true
            })
                .done(function(response) {
                    if (response.errcode) {
                        processError(response.errcode, response.msg);
                    }
                    else {
                        this.__isActual = true;
                        var items = this.__transformResponseFn ?
                            this.__transformResponseFn(response.data) : response.data;
                        this.setOriginalArray(items);
                    }
                }.bind(this))
                
                .fail(function() {
                    processError(-1);
                }.bind(this))
                
                .always(function() {
                    this.__query = null;
                    this._setLoading(false);
                }.bind(this));
            
            return this.__query;
        }
    }
});