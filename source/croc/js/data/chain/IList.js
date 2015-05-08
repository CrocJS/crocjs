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
        
        lookup: function(iface) {},
        
        lookupOrChain: function(iface, Cls, options) {},
        
        refTo: function(model) {}
    }
});