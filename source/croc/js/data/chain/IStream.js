croc.Interface.define('croc.data.chain.IStream', {
    extend: croc.data.chain.IPromise,
    events: {
        failure: null
    },
    properties: {
        loading: {
            getter: null,
            event: true
        }
    },
    members: {
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
         * Cancel the query
         */
        stopLoading: function() {}
    }
});