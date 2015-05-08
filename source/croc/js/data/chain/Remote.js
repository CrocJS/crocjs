croc.Class.define('croc.data.chain.Remote', {
    extend: croc.data.chain.Atom,
    
    implement: [
        croc.data.chain.IBuffer,
        croc.data.chain.IStream
    ],
    
    events: {
        /**
         * @param {string} message
         * @param {string} code
         */
        failure: null
    },
    
    properties: {
        hasMoreItems: {
            value: false,
            field: '__hasMoreItems',
            __setter: null,
            event: true
        },
        
        loading: {
            value: false,
            field: '__loading',
            __setter: null,
            event: true
        }
    },
    
    options: {
        /**
         * Нужно ли получать элементы с сервера в изначальном состоянии модели
         * @type {boolean}
         */
        initialHasMoreItems: false,
        
        /**
         * Type of request param for items limiting
         * limit - {start: ..., limit: ...}
         * to - {from: ..., to: ...}
         * @type {string}
         */
        limitParamType: {
            check: ['limit', 'to'],
            value: 'to'
        },
        
        /**
         * Additional parameters for a request
         * @type {Object}
         */
        params: {},
        
        /**
         * Количество элементов, которые следует запросить с сервера
         * @type {number}
         */
        queryCount: {},
        
        /**
         * максимальное количество элементов
         * @type {number}
         */
        queryLimit: {},
        
        /**
         * Адрес контроллера
         * @type {string}
         */
        url: {
            required: true
        }
    },
    
    construct: function(options) {
        croc.data.chain.Remote.superclass.construct.apply(this, arguments);
        
        this.__actualElements = true;
        this.__hasMoreItems = options.initialHasMoreItems;
        this.__lastItemIndex = -1;
        this.__loading = false;
        this.__items = [];
        
        this.on('change', function() {
            if (!this.__internalChange) {
                this.__lastItemIndex = this.getLength() - 1;
            }
        }, this);
        
        //if (this.getLength() > 0) {
        //    this.__hasMoreItems = true;
        //    this.__lastItemIndex = this.getLength() - 1;
        //}
    },
    
    members: {
        getItems: function() {
            return this.__items;
        },
        
        /**
         * Пометить модель неактуальной. Если removeElements===false, то элементы будут удалены при следующей подгрузке
         * новых элементов
         * @param {boolean} [removeElements=true]
         */
        invalidateElements: function(removeElements) {
            this.__actualElements = false;
            this.stopLoading();
            if (removeElements === undefined || removeElements) {
                this.fireEvent('change', (this.__items = []));
                this.__setHasMoreItems(this._options.initialHasMoreItems);
            }
        },
        
        /**
         * Актуальна ли модель
         * @returns {boolean}
         */
        isActualElements: function() {
            return this.__actualElements;
        },
        
        needMore: function() {
            var count = this._options.queryCount;
            
            if (this.__query) {
                //todo исправить это
                return;
            }
            
            if (this.__actualElements && this.__lastItemIndex === Number.MAX_VALUE) {
                return;
            }
            
            var fromIndex = count ? (this.__actualElements ? this.__lastItemIndex + 1 : 0) : undefined;
            var toIndex = count ? fromIndex + count - 1 : undefined;
            if (this._options.queryLimit && toIndex >= this._options.queryLimit) {
                toIndex = this._options.queryLimit - 1;
            }
            var theoreticalTo = count === undefined ? Number.MAX_VALUE : toIndex;
            
            if (theoreticalTo > this.__lastItemIndex || !this.__actualElements) {
                var params = this._getParams(this.__actualElements ? this.__lastItemIndex + 1 : 0, toIndex);
                if (!params) {
                    return;
                }
                
                this._setLoading(true);
                this.__query = this._sendRequest(params);
                
                this.__query
                    .done(function(response) {
                        this.__lastItemIndex = theoreticalTo;
                        this.__processResponse(response, toIndex);
                    }.bind(this))
                    
                    .fail(function(error) {
                        this.fireEvent('failure', error.message, error.code);
                        this.__setHasMoreItems(false);
                    }.bind(this))
                    
                    .always(function() {
                        this.__query = null;
                        this._setLoading(false);
                    }.bind(this));
            }
        },
        
        /**
         * Cancel the query
         */
        stopLoading: function() {
            if (this.__query) {
                this.__query.abort();
                this.__query = null;
            }
            
            if (this.__loading) {
                this._setLoading(false);
            }
        },
        
        /**
         * Возвращает параметры запроса
         * @param fromIndex
         * @param toIndex
         * @returns {Object}
         * @protected
         */
        _getParams: function(fromIndex, toIndex) {
            var params = this._options.limitParamType === 'limit' ? {
                start: fromIndex,
                limit: toIndex - fromIndex + 1
            } : {
                'from': fromIndex,
                to: toIndex
            };
            return _.assign(params, this._options.params);
        },
        
        /**
         * Послать запрос на сервер
         * @param {Object} params
         * @return {jqXHR}
         * @protected
         */
        _sendRequest: function(params) {
            var def = $.ajax({
                type: 'post',
                dataType: 'json',
                async: true,
                timeout: 50000,
                url: this._options.url,
                data: params
            });
            this._getDisposer().addCallback(def.abort, def);
            return def;
        },
        
        /**
         * @param {Object} items
         * @param {number} lastIndex
         * @private
         */
        __processResponse: function(items, lastIndex) {
            if (!this.__actualElements) {
                this.fireEvent('change', (this.__items = []));
                this.__setHasMoreItems(this._options.initialHasMoreItems);
            }
            
            this.__actualElements = true;
            
            if (!lastIndex) {
                this.__setHasMoreItems(false);
            }
            else {
                this.__setHasMoreItems(this.getLength() + items.length >= lastIndex + 1);
            }
            
            if (this._options.queryLimit && items.length + this.getLength() > this._options.queryLimit) {
                items = items.slice(0, this._options.queryLimit - this.getLength());
            }
            if (items.length) {
                this.__internalChange = true;
                this.fireEvent('change', (this.__items = this.__items.concat(items)));
                this.__internalChange = false;
            }
        }
    }
});