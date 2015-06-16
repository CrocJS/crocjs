/**
 * Массив в хранилищи html5 localStorage
 */
croc.Class.define('croc.data.LocalStorageArray', {
    extend: croc.data.ObservableArray,
    
    options: {
        /**
         * Ключ массива в localStorage
         * @type {String}
         */
        key: null,
        
        /**
         * Запросить элементы по умолчанию, если массива с заданным ключом не существует
         * @type {function():Array}
         */
        requestDefaultItems: {
            type: 'function',
            value: function() {
                return [];
            }
        }
    },
    
    construct: function(options) {
        if (!options.key) {
            throw new Error('Не передан ключ хранилища');
        }
        
        this.__key = options.key;
        
        var lsArray = this.__getLsArray();
        options.original = lsArray || options.requestDefaultItems();
        if (!lsArray) {
            this.__setLsArray(options.original);
        }
        
        croc.data.LocalStorageArray.superclass.construct.apply(this, arguments);
        
        this.on('change', function() {
            this.__setLsArray(this.getArray());
        }.bind(this));
        
        this._getDisposer().addListener($(window), 'storage', function(e) {
            e = e.originalEvent;
            if (e.key === this.__key) {
                //TODO: найти разницу
                var lsArray = this.__getLsArray();
                if (!croc.utils.arrEqual(lsArray, this.getArray())) {
                    this.replaceAll(lsArray);
                }
            }
        }.bind(this));
    },
    
    members: {
        /**
         * @private
         */
        __getLsArray: function() {
            var array = localStorage.getItem(this.__key);
            return array ? JSON.parse(array) : null;
        },
        
        /**
         * @private
         */
        __setLsArray: function(items) {
            localStorage.setItem(this.__key, JSON.stringify(items));
        }
    }
});