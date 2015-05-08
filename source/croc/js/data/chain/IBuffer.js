croc.Interface.define('croc.data.chain.IBuffer', {
    extend: croc.data.chain.IPromise,
    members: {
        needMore: function() {}
    }
});