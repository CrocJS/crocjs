/**
 * Список элементов, изменения которого можно отследить, но который нельзя изменять
 */
croc.Interface.define('croc.data.IObservableList', {
    extend: croc.IObject,
    
    events: {
        /**
         * изменение данных массива
         * @param {number} index
         * @param {Array} insert
         * @param {Array} remove
         */
        change: null,
        
        /**
         * @param item
         * @param {number} index
         */
        updateItem: null
    },
    
    properties: {
        /**
         * Длина массива
         * @type {number}
         */
        length: {
            type: 'number',
            getter: null,
            event: true
        },
        
        /**
         * Является ли массив пустым
         * @type {boolean}
         */
        empty: {
            type: 'boolean',
            getter: null,
            event: true
        }
    },
    
    members: {
        /**
         * Возвращает копию исходного массива
         * @return {Array}
         */
        cloneRawArray: function() {},
        
        /**
         * Алиас для getArray().forEach(iterator, context)
         * @param {function(*, number)} iterator
         * @param [context=null]
         */
        forEach: function(iterator, context) {},
        
        /**
         * Возвращает исходный массив
         * @return {Array}
         */
        getArray: function() {},
        
        /**
         * Алиас для getArray()[index]
         * @param {Number} index
         * @return {*}
         */
        getItem: function(index) {},
        
        /**
         * Алиас для getArray().length
         * @return {Number}
         */
        getLength: function() {},
        
        /**
         * Версия массива (количество изменений с момента создания)
         * @returns {number}
         */
        getVersion: function() {},
        
        /**
         * Алиас для getArray().indexOf(searchElement, fromIndex)
         * @param searchElement
         * @param [fromIndex=0]
         * @return {Number}
         */
        indexOf: function(searchElement, fromIndex) {},
        
        /**
         * Отслеживать изменения массива (если в массиве есть элементы, то сразу же запускает callback)
         * @param {function(number, Array, Array)} callback
         * @param {Object} [context]
         * @returns {Function}
         */
        listenChanges: function(callback, context) {}
    }
});
