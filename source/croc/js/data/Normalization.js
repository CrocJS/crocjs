croc.Class.define('croc.data.Normalization', {
    type: 'static',
    
    statics: {
        denormalize: function(type, item) {
            if (!item) {
                return item;
            }
            
            if (item.$$source) {
                return item.$$source;
            }
            
            switch (type) {
                case 'metro':
                    return {
                        id: item.value,
                        name: item.text,
                        color: item.color,
                        lines: item.lines
                    };
                
                default:
                    throw new Error('Unexpected type');
            }
        },
        
        normalize: function(type, item) {
            if (!item) {
                return item;
            }
            
            switch (type) {
                case 'metro':
                    return {
                        value: item.id,
                        text: item.name,
                        color: item.color,
                        lines: item.lines,
                        $$source: item
                    };
                
                default:
                    throw new Error('Unexpected type');
            }
        },
        
        normalizeFn: function(type) {
            return this.normalize.bind(this, type);
        }
    }
});
