croc.Class.define('croc.data.chain.Buffer', {
    extend: croc.data.chain.Limit,
    implement: croc.data.chain.IBuffer,
    properties: {
        hasMoreItems: {
            value: false,
            __setter: null,
            event: true
        }
    },
    options: {
        buffer: {
            type: 'number',
            required: true
        }
    },
    construct: function(options) {
        if (!this.getLimit() && this.getLimit() !== 0) {
            this.setLimit(options.buffer * 2);
        }
        var initialLimit = this.getLimit();
        
        croc.data.chain.Buffer.superclass.construct.apply(this, arguments);
        
        var promise = this.lookup('croc.data.chain.IPromise', true);
        var observable = croc.Object.createModel({hasMoreItems: false});
        if (promise) {
            promise.bind('hasMoreItems', observable, 'hasMoreItems');
        }
        
        this.getSource().on('change', function(items, oldItems) {
            if (items.length < oldItems.length || !croc.utils.arrEqual(items.slice(0, oldItems.length), oldItems)) {
                this.setLimit(initialLimit);
            }
        }, this);
        
        croc.Object.multiBind(
            observable, 'hasMoreItems',
            this, 'limit',
            this, 'offset',
            this.getSource(), 'length',
            this, '__hasMoreItems',
            function(hasMoreItems, limit, offset, length) {
                return hasMoreItems || length > offset + limit;
            }, this
        );
    },
    members: {
        needMore: function() {
            var sourceLength = this.getSourceItems().length;
            var length = this.getLength();
            if (sourceLength >= length) {
                this.setLimit(this.getLimit() + this._options.buffer);
                if (sourceLength > length) {
                    return;
                }
            }
            
            var buffer = this.lookup('croc.data.chain.IBuffer', true);
            if (buffer) {
                buffer.needMore();
            }
        }
    }
});