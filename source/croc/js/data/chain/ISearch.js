croc.Interface.define('croc.data.chain.ISearch', {
    extend: croc.data.chain.IList,
    properties: {
        /**
         * Items to exclude from source
         * @type {Array}
         */
        excludes: {
            type: 'array'
        },
        
        /**
         * строка поиска
         * @type {String}
         */
        searchString: {
            type: 'string'
        }
    }
});