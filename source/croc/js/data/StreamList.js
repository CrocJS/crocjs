/**
 */
croc.Class.define('croc.data.StreamList', {
    extend: croc.data.ObservableArray,
    implement: croc.data.IStreamList,
    
    events: {
        /**
         * Произошла ошибка при получении данных
         * @param code
         * @param {string} message
         */
        error: null,
        
        /**
         * @param {number} count
         */
        prepareMore: null
    },
    
    properties: {
        /**
         * Есть ли ещё неподгруженные элементы
         * @type {boolean}
         */
        hasMoreItems: {
            type: 'boolean',
            event: true
        },
        
        /**
         * Идёт ли в данный момент подгрузка элементов
         * @type {boolean}
         */
        loading: {
            event: true
        }
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
            return false;
        },
        
        /**
         * Вызвать функцию когда данные будут загружены (или моментально, если они уже загружены)
         * @param {function} callback
         * @param {Object} [context]
         */
        onLoaded: function(callback, context) {
            if (this.getLoading()) {
                this.once('changeLoading', function() {
                    callback.call(context || this);
                }, this);
            }
            else {
                callback.call(context || this);
            }
        },
        
        /**
         * Если элементы ещё не подгружены, то подгружает их
         * в данный момент работает последовательно
         * @param {number} [count=undefined]
         */
        prepareMore: function(count) {
            this.fireEvent('prepareMore', count);
        }
    }
});
