croc.Interface.define('croc.data.chain.IList', {
    events: {
        change: null
    },
    properties: {
        length: {
            setter: null,
            event: true
        }
    },
    members: {
        chain: function(Cls, options, lookup) {},
        
        getItems: function() {},
        
        /**
         * @returns {croc.data.chain.IList}
         */
        getRoot: function() {},
        
        lookup: function(iface, skipMe) {},
        
        lookupOrChain: function(iface, Cls, options) {},
        
        refTo: function(model) {}
    }
});