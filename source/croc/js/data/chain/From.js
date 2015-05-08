var Model = require('derby/node_modules/racer/lib/Model/Model');

croc.Class.define('croc.data.chain.From', {
    extend: croc.data.chain.Atom,
    
    statics: {
        resolve: function(source) {
            if (source && source instanceof Model && croc.Interface.check(source.get(), 'croc.data.chain.IList')) {
                return source.get();
            }
            return croc.Interface.check(source, 'croc.data.chain.IList') ? source :
                new croc.data.chain.From({source: source});
        }
    },
    
    options: {
        source: {}
    },
    construct: function(options) {
        if (Array.isArray(options.source)) {
            this.__items = options.source;
        }
        else {
            this.__items = options.source.get() || [];
            options.source.on('all', function() {
                this.setItems(options.source.get() || []);
            }.bind(this));
        }
        
        croc.data.chain.From.superclass.construct.apply(this, arguments);
    },
    members: {
        getItems: function() {
            return this.__items;
        },
        setItems: function(items) {
            var old = this.__items;
            this.__items = items;
            this.fireEvent('change', this.__items, old);
        }
    }
});