croc.Class.define('croc.data.chain.Atom', {
    extend: croc.Object,
    implement: croc.data.chain.IList,
    events: {
        change: null
    },
    properties: {
        length: {
            setter: null,
            event: true
        }
    },
    construct: function() {
        croc.data.chain.Atom.superclass.construct.apply(this, arguments);
        this.setLength(this.getItems().length);
        this.on('change', function(items) {
            this.setLength(items.length);
        }, this);
    },
    members: {
        chain: function(Cls, options) {
            return new Cls(_.assign({}, options, {source: this}));
        },
        
        getItems: function() { throw 'abstract!'; },
        
        lookup: function(iface, skipMe) {
            if (skipMe) {
                return null;
            }
            return croc.utils.arr(iface).some(function(x) { return croc.Interface.check(this, x); }, this) ? this : null;
        },
        
        lookupOrChain: function(iface, Cls, options) {
            var result = {needle: this.lookup(iface)};
            if (!result.needle) {
                result.chain = result.needle = this.chain(Cls, options);
            }
            else {
                result.chain = this;
            }
            return result;
        },
        
        refTo: function(model) {
            model.set(this.getItems().concat());
            this.on('change', function(items) {
                model.setArrayDiff(items);
            });
        }
    }
});