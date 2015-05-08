croc.ns('croc.data');

/**
 * Модель, которая получает и обновляет данные с сервера
 *
 * @extends {croc.data.ObservableArray}
 * @implements {croc.data.IStreamList}
 * @event changeHasMoreItems (value: {boolean}, oldValue: {boolean})
 * @event changeLoading (value: {boolean}, oldValue: {boolean})
 * @event failure (code: {number}, message: {string})
 */
croc.data.RemoteList = croc.extend(croc.data.ObservableArray, {
    
    /**
     * action контроллера
     * @type {string}
     */
    action: null,
    
    /**
     * Количество элементов, которые следует запросить с сервера
     * @type {number}
     */
    queryCount: null,
    
    /**
     * задержка перед отправкой запроса на сервер
     * @type {number}
     */
    queryDelay: 0,
    
    /**
     * максимальное количество элементов
     * @type {number}
     */
    queryLimit: null,
    
    /**
     * Нужно ли получать элементы с сервера в изначальном состоянии модели
     * @type {boolean}
     */
    initialHasMoreItems: false,
    
    /**
     * Функция вызывается перед отправкой запроса на сервер
     * @type {function(Object)}
     */
    preRequestFn: null,
    
    /**
     * Адрес контроллера
     * @type {string}
     * @required
     */
    url: null,
    
    //properties
    /**
     * Есть ли ещё неподгруженные элементы
     * @returns {boolean}
     */
    getHasMoreItems: function() {
        return this.__hasMoreItems;
    },
    
    /**
     * @param {boolean} value
     */
    __setHasMoreItems: function(value) {
        if (value !== this.__hasMoreItems) {
            var oldValue = this.__hasMoreItems;
            this.__hasMoreItems = value;
            this.fireEvent('changeHasMoreItems', value, oldValue);
        }
    },
    
    /**
     * Идёт ли в данный момент подгрузка элементов
     * @returns {boolean}
     */
    getLoading: function() {
        return this.__loading;
    },
    
    /**
     * @param {boolean} loading
     * @protected
     */
    _setLoading: function(loading) {
        if (this.__loading === loading) {
            return;
        }
        this.__loading = loading;
        this.fireEvent('changeLoading', loading, !loading);
    },
    //
    
    init: function() {
        /**
         * @type {boolean}
         * @private
         */
        this.__actualElements = true;
        
        /**
         * @type {boolean}
         * @private
         */
        this.__hasMoreItems = this.initialHasMoreItems;
        
        /**
         * @type {number}
         * @private
         */
        this.__lastItemIndex = -1;
        
        /**
         * @type {boolean}
         * @private
         */
        this.__loading = false;
        
        this.on('change', function() {
            if (!this.__internalChange) {
                this.__lastItemIndex = this.getLength() - 1;
            }
        }, this);
        
        croc.data.RemoteList.superclass.init.call(this);
        
        if (this.getLength() > 0) {
            this.__hasMoreItems = true;
            this.__lastItemIndex = this.getLength() - 1;
        }
    },
    
    /**
     * Отменить запрос
     */
    cancelQuery: function() {
        if (this.__query) {
            this.__query.abort();
            this.__query = null;
        }
        
        if (this.__loading) {
            this._setLoading(false);
        }
    },
    
    /**
     * Количество элементов, которые единовременно подгружаются в поток по-умолчанию
     * @type {number}
     */
    getDefaultCount: function() {
        return this.queryCount;
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
        this.__actualElements = false;
        this.cancelQuery();
        if (removeElements === undefined || removeElements) {
            this.removeAll();
            this.__setHasMoreItems(this.initialHasMoreItems);
        }
    },
    
    /**
     * Актуальна ли модель
     * @returns {boolean}
     */
    isActualElements: function() {
        return this.__actualElements;
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
     */
    prepareMore: function(count) {
        if (!count && this.queryCount) {
            count = this.queryCount;
        }
        
        if (this.__query) {
            //todo исправить это
            return;
        }
        
        if (this.__actualElements && this.__lastItemIndex === Number.MAX_VALUE) {
            return;
        }
        
        var from = count ? (this.__actualElements ? this.__lastItemIndex + 1 : 0) : undefined;
        var to = count ? from + count - 1 : undefined;
        if (this.queryLimit && to >= this.queryLimit) {
            to = this.queryLimit - 1;
        }
        var theoreticalTo = count === undefined ? Number.MAX_VALUE : to;
        
        if (theoreticalTo > this.__lastItemIndex || !this.__actualElements) {
            var params = this._getParams(this.__actualElements ? this.__lastItemIndex + 1 : 0, to);
            if (!params) {
                return;
            }
            
            this.__query = this._sendRequest(params, function() {
                this._setLoading(true);
            }.bind(this));
            
            this.__query
                .done(function(response) {
                    this.__lastItemIndex = theoreticalTo;
                    this.__processResponse(response, to);
                }.bind(this))
                
                .fail(function() {
                    this.__processResponse({errcode: -1}, to);
                }.bind(this))
                
                .always(function() {
                    this.__query = null;
                    this._setLoading(false);
                }.bind(this));
        }
    },
    
    /**
     * Извлекает из ответа контроллера элементы списка. Возвращает null если произошла ошибка.
     * @param {Object} response
     * @param {number} error
     * @returns {Array}
     * @protected
     */
    _getItemsFromResponse: function(response, error) {
        return error ? null : (response.data && response.data.items) || response.data || [];
    },
    
    /**
     * Возвращает параметры запроса
     * @param from
     * @param to
     * @returns {Object}
     * @protected
     */
    _getParams: function(from, to) {
        return {
            from: from,
            to: to
        };
    },
    
    /**
     * Получен ответ с сервера
     * @param {Object} response
     * @protected
     */
    _onResponse: function(response) {},
    
    /**
     * Послать запрос на сервер
     * @param {Object} params
     * @param onRequest
     * @return {jqXHR}
     * @protected
     */
    _sendRequest: function(params, onRequest) {
        if (this.preRequestFn) {
            this.preRequestFn(params);
        }
        
        return stm.ajax({
            disposer: this._getDisposer(),
            url: this.url,
            data: this.action ? [
                {
                    action: this.action,
                    params: params
                }
            ] : params,
            forceCache: true,
            delayRequest: this.queryDelay,
            onRequest: onRequest
        });
    },
    
    /**
     * @param {Object} response
     * @param {number} lastIndex
     * @private
     */
    __processResponse: function(response, lastIndex) {
        this._onResponse(response);
        
        var result = response.result && response.result.length > 0 ? response.result[0] : response;
        var error = response.errcode || result.errcode;
        
        if (result && result.result) {
            result = result.result;
        }
        
        if (!this.__actualElements) {
            this.removeAll();
            this.__setHasMoreItems(this.initialHasMoreItems);
        }
        
        var items = this._getItemsFromResponse(result, error);
        if (!items) {
            this.fireEvent('failure', error, response.msg || result.msg);
            this.__setHasMoreItems(false);
        }
        else {
            this.__actualElements = true;
            
            if (!lastIndex) {
                this.__setHasMoreItems(false);
            }
            else {
                this.__setHasMoreItems(this.getLength() + items.length >= lastIndex + 1);
            }
            
            if (this.queryLimit && items.length + this.getLength() > this.queryLimit) {
                items = items.slice(0, this.queryLimit - this.getLength());
            }
            if (items.length) {
                this.__internalChange = true;
                this.append(items);
                this.__internalChange = false;
            }
        }
    }
});

croc.implement(croc.data.RemoteList, croc.data.IStreamList);