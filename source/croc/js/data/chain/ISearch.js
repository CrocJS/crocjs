croc.Interface.define('croc.data.chain.ISearch', {
    extend: croc.data.chain.IList,
    properties: {
        /**
         * строка поиска
         * @type {String}
         */
        searchString: {
            type: 'string'
        }
    }
});