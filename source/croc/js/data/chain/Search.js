croc.Class.define('croc.data.chain.Search', {
    extend: croc.data.chain.Map,
    implement: croc.data.chain.ISearch,
    properties: {
        /**
         * Items to exclude from source
         * @type {Array}
         */
        excludes: {
            type: 'array',
            apply: function() {
                this.update();
            },
            event: true
        },
        
        /**
         * строка поиска
         * @type {String}
         */
        searchString: {
            type: 'string',
            apply: function(value) {
                this.__searchRegexp = value && new RegExp(croc.utils.strEscapeRegexp(value), 'i');
                this.update();
            },
            event: true
        }
    },
    options: {
        initiallyEmpty: {},
        
        mapper: {
            hide: true
        },
        
        /**
         * Функция, которая возвращает части элементов массива, по которым возможен поиск
         * @type {function(*):Array}
         */
        searchableItemPartsFn: {
            type: 'function',
            value: function(item) {
                return Array.isArray(item) ? item : typeof item === 'object' ? croc.utils.objValues(item) : [item];
            }
        }
    },
    construct: function(options) {
        options.mapper = function(items) {
            if (this.__searchRegexp) {
                items = items.filter(function(item) {
                    return options.searchableItemPartsFn(item).some(function(part) {
                        return (!!part || part === 0) && this.__searchRegexp.test(part.toString());
                    }, this);
                }, this);
            }
            else if (options.initiallyEmpty) {
                items = [];
            }
            
            var excludes = this.getExcludes();
            if (excludes && excludes.length) {
                items = items.filter(function(item) {
                    return !excludes.some(_.partial(croc.utils.objEqual, item));
                });
            }
            
            return items;
        }.bind(this);
        
        croc.data.chain.Search.superclass.construct.apply(this, arguments);
    }
});