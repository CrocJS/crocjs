croc.Class.define('croc.data.chain.Search', {
    extend: croc.data.chain.Map,
    implement: croc.data.chain.ISearch,
    properties: {
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
            return this.__searchRegexp ?
                items.filter(function(item) {
                    return options.searchableItemPartsFn(item).some(function(part) {
                        return (!!part || part === 0) && this.__searchRegexp.test(part.toString());
                    }, this);
                }, this) :
                options.initiallyEmpty ? [] : items;
        }.bind(this);
        
        croc.data.chain.Search.superclass.construct.apply(this, arguments);
    }
});