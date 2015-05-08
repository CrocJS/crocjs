croc.ns('croc.ui.form.suggestion.model');

/**
 * Модель управляет списком элементов для полей с подсказками
 * @extends {croc.data.RemoteList}
 * @implements {croc.data.ISearchableList}
 * @event changeSearchString (value: {string}, oldValue: {string})
 */
croc.ui.form.suggestion.model.Base = croc.extend(croc.data.RemoteList, {
    
    /**
     * минимальная длина строки поиска для получения элементов с сервера
     * @type {number}
     */
    minSearchStringLength: 3,
    
    /**
     * Разрешено ли запрашивать
     * @type {boolean}
     */
    unfilteredQueriesEnabled: false,
    
    /**
     * задержка перед отправкой запроса на сервер
     * @type {number}
     */
    queryDelay: 500,
    
    //properties
    /**
     * элементы, которые нужно исключить из коллекции
     * @returns {Array}
     */
    getExcludes: function() {
        return this.__excludes;
    },
    
    /**
     * элементы, которые нужно исключить из коллекции
     * @param {Array} value
     */
    setExcludes: function(value) {
        this.__excludes = value && value.length ? value : null;
        this.invalidateElements();
    },
    
    /**
     * строка поиска
     * @returns {string}
     */
    getSearchString: function() {
        return this.__searchString;
    },
    
    /**
     * Изменить строку поиска
     * @param {string} value
     */
    setSearchString: function(value) {
        value = value && value.trim();
        if (!this.isActualElements() || value !== this.__searchString) {
            var oldValue = this.__searchString;
            this.__searchString = value;
            
            this.invalidateElements();
            if (!!value && value.length >= this.minSearchStringLength) {
                this.prepareMore();
            }
            
            this.fireEvent('changeSearchString', value, oldValue);
        }
    },
    //
    
    init: function() {
        /**
         * @type {string}
         * @private
         */
        this.__searchString = null;
        
        croc.ui.form.suggestion.model.Base.superclass.init.call(this);
    },
    
    /**
     * @param from
     * @param to
     * @returns {Object}
     * @protected
     */
    _getParams: function(from, to) {
        if (!this.unfilteredQueriesEnabled && !this.getSearchString()) {
            return null;
        }
        
        var params = {
            query: this.getSearchString()
        };
        
        if (to) {
            params.start = from;
            params.limit = to - from + 1;
        }
        
        if (this.__excludes) {
            params.excludes = this.__excludes.map(function(x) { return x.value; });
        }
        
        return params;
    }
});

croc.implement(croc.ui.form.suggestion.model.Base, croc.data.ISearchableList);
