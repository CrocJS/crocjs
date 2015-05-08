croc.Interface.define('croc.data.chain.IPromise', {
    extend: croc.data.chain.IList,
    properties: {
        hasMoreItems: {
            getter: null,
            event: true
        }
    }
});