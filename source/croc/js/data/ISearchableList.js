/**
 * Модель, элементы которой можно фильтровать по переданной строке
 */
croc.Interface.define('croc.data.ISearchableList', {
    extend: croc.data.IObservableList,
    
    properties: {
        /**
         * строка поиска
         * @type {String}
         */
        searchString: {
            type: 'string',
            event: true
        },
        
        /**
         * элементы, которые нужно исключить из коллекции
         * @type {Array}
         */
        excludes: {
            type: 'array'
        }
    }
});