croc.Class.define('croc.data.chain.Map', {
    extend: croc.data.chain.Atom,
    options: {
        mapper: {},
        source: {}
    },
    construct: function(options) {
        this.__mapper = options.mapper || function(x) { return x.concat(); };
        
        var source = options.source;
        this.__source = source;
        this.__sourceItems = source.getItems();
        
        source.on('change', function(items) {
            this.__sourceItems = items;
            this.update();
        }, this);
        this.update();
        
        croc.data.chain.Map.superclass.construct.apply(this, arguments);
    },
    members: {
        lookup: function(iface, skipMe) {
            return croc.data.chain.Map.superclass.lookup.apply(this, arguments) || this.__source.lookup(iface);
        },
        getItems: function() {
            return this.__resultItems;
        },
        /**
         * @returns {croc.data.chain.IList}
         */
        getRoot: function() {
            return this.__source.getRoot();
        },
        getSource: function() {
            return this.__source;
        },
        getSourceItems: function() {
            return this.__sourceItems;
        },
        update: function() {
            if (!this.__mapper) {
                return;
            }
            
            var oldItems = this.__resultItems;
            this.__resultItems = this.__mapper(this.__sourceItems);
            if (!croc.utils.arrEqual(this.__resultItems, oldItems)) {
                this.fireEvent('change', this.__resultItems, oldItems);
            }
        }
    }
});