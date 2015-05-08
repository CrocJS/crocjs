/**
 * IObservableList, который также позволяет отследить состояние loading и запросить следующие элементы
 */
croc.Interface.define('croc.data.IStreamList', {
    extend: croc.data.IObservableList,
    
    events: {
        /**
         * Произошла ошибка при получении данных
         * @param code
         * @param {string} message
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
            getter: true,
            event: true
        },
        
        /**
         * Идёт ли в данный момент подгрузка элементов
         * @type {boolean}
         */
        loading: {
            type: 'boolean',
            getter: true,
            event: true
        }
    },
    
    members: {
        /**
         * Количество элементов, которые единовременно подгружаются в поток по-умолчанию
         * @type {number}
         */
        getDefaultCount: function() {},
        
        /**
         * Возвращает индекс элемента ещё не полученного в поток, если его возможно получить. Иначе возвращает null.
         * @param item
         * @returns {number}
         */
        indexInStream: function(item) {},
        
        /**
         * Пометить модель неактуальной. Если removeElements===false, то элементы будут удалены при следующей подгрузке
         * новых элементов
         * @param {boolean} [removeElements=true]
         */
        invalidateElements: function(removeElements) {},
        
        /**
         * Актуальна ли модель
         * @returns {boolean}
         */
        isActualElements: function() {},
        
        /**
         * Есть ли гарантия, что поток пополняется синхронно
         * @returns {boolean}
         */
        isSync: function() {},
        
        /**
         * Если элементы ещё не подгружены, то подгружает их в данный момент работает последовательно
         * @param {number} [count=undefined]
         */
        prepareMore: function(count) {}
    }
});
