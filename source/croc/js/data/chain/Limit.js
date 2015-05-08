croc.Class.define('croc.data.chain.Limit', {
    extend: croc.data.chain.Map,
    properties: {
        limit: {
            type: 'number',
            apply: function() {
                this.update();
            },
            event: true,
            option: true
        },
        offset: {
            type: 'number',
            value: 0,
            apply: function() {
                this.update();
            },
            event: true,
            option: true
        }
    },
    options: {
        mapper: {
            hide: true
        }
    },
    construct: function(options) {
        options.mapper = function(items) {
            var limit = this.getLimit();
            return limit === 0 ? [] : limit ? items.slice(this.getOffset(), this.getOffset() + limit) : items;
        }.bind(this);
        
        croc.data.chain.Limit.superclass.construct.apply(this, arguments);
    }
});