/**
 * Массив, возбуждающий событие change и changeLength при его изменении
 */
croc.Class.define('croc.data.ObservableArray', {
    extend: croc.Object,
    implement: croc.data.IObservableList,
    
    statics: {
        /**
         * Синхронизирует два массива source и dest (source сортируется для сохранения порядка)
         * @param {croc.data.ObservableArray|croc.data.IObservableList} source
         * @param {croc.data.ObservableArray} dest
         * @param {Object} [options]
         * @param {boolean} [options.oneWay=false]
         * @param {boolean} [options.weak=false] не сохранять сортировку массивов
         * @param {boolean} [options.weakDuplicates=true] разрешить ли вставку одинаковых элементов в режиме weak
         * @return {Function}
         * @static
         */
        linkArrays: function(source, dest, options) {
            var disposer = new croc.util.Disposer();
            if (!options) {
                options = {};
            }
            if (!('weakDuplicates' in options)) {
                options.weakDuplicates = true;
            }
            
            if (!options.weak) {
                var sourceArray = source.getArray();
                var remove = [];
                dest.getArray().forEach(function(x, index) {
                    if (sourceArray.indexOf(x) === -1) {
                        remove.push(index);
                    }
                });
                var insert = _.difference(source.getArray(), dest.getArray());
                
                remove.reverse().forEach(function(i) {
                    dest.removeAt(i);
                });
                insert.forEach(function(item) {
                    dest.push(item);
                });
                
                if (options.oneWay) {
                    dest.sort(function(a, b) {
                        return source.indexOf(a) - source.indexOf(b);
                    });
                }
                else {
                    source.sort(function(a, b) {
                        return dest.indexOf(a) - dest.indexOf(b);
                    });
                }
            }
            
            var sync = false;
            
            function bind(source, dest) {
                disposer.addListeners(source, {
                    change: function(index, remove, insert) {
                        if (sync) {
                            return;
                        }
                        sync = true;
                        if (options.weak) {
                            remove.forEach(function(x) { dest.remove(x); });
                            if (options.weakDuplicates) {
                                dest.append(insert);
                            }
                            else {
                                insert.forEach(function(x) { dest.toggleItem(x, true); });
                            }
                        }
                        else {
                            dest.replaceRange(index, remove.length, insert);
                        }
                        sync = false;
                    },
                    updateItem: function(item, index) {
                        if (sync) {
                            return;
                        }
                        sync = true;
                        if (options.weak) {
                            dest.onUpdateItem(item);
                        }
                        else {
                            dest.onUpdateItemAt(index);
                        }
                        sync = false;
                    }
                });
            }
            
            bind(source, dest);
            if (!options.oneWay) {
                bind(dest, source);
            }
            
            return function() {
                disposer.disposeAll();
            };
        },
        
        /**
         * Отображение массива source на массив dest. Функция mapper трансформирует каждый элемент при отображении. Возвращает
         * функцию, которая разрывает отображение при её вызове.
         * @param {croc.data.IObservableList} source
         * @param {croc.data.ObservableArray} dest
         * @param {function(*):*} [mapper]
         * @param [context]
         * @return {Function}
         * @static
         */
        mapArray: function(source, dest, mapper, context) {
            function map(arr) {
                var mapped = [];
                $.each(arr, function(i, item) {
                    mapped.push(mapper ? mapper.call(context || window, item) : item);
                });
                
                return mapped;
            }
            
            var changeListener = source.on('change', function(index, remove, insert) {
                dest.splice.apply(dest, [index, remove.length].concat(map(insert)));
            });
            
            var updateListener = source.on('updateItem', function(item, index) {
                dest.onUpdateItemAt(index);
            });
            
            if (source.getLength() > 0) {
                var mapped = map(source.getArray());
                if (!croc.utils.arrEqual(dest.getArray(), mapped)) {
                    dest.replaceAll(mapped);
                }
            }
            
            
            return function() {
                changeListener();
                updateListener();
            };
        }
    },
    
    events: {
        /**
         * изменение данных массива
         * @param {number} index
         * @param {Array} insert
         * @param {Array} remove
         */
        change: null,
        
        /**
         * @param item
         * @param {number} index
         */
        updateItem: null
    },
    
    properties: {
        /**
         * Длина массива
         * @type {number}
         */
        length: {
            type: 'number',
            field: '__length',
            __setter: null,
            event: true
        },
        
        /**
         * Является ли массив пустым
         * @type {boolean}
         */
        empty: {
            type: 'boolean',
            field: '__empty',
            __setter: null,
            event: true
        }
    },
    
    options: {
        /**
         * Оригинальный массив
         * @type {Array}
         */
        original: null
    },
    
    construct: function(options) {
        this.__original = options.original || [];
        this.__lastLength = this.__original.length;
        this.__version = 0;
        this.__length = this.__original.length;
        this.__empty = !this.__length;
        
        croc.data.ObservableArray.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Добавление всех элементов из переданного массива в конец текущего
         * @param {Array|croc.data.ObservableArray} items
         */
        append: function(items) {
            if (items instanceof croc.data.ObservableArray) {
                items = items.getArray();
            }
            if (!Array.isArray(items)) {
                throw new TypeError('items должен быть массивом!');
            }
            if (items.length === 0) {
                return;
            }
            var arrayLength = this.__original.length;
            this.__original.splice.apply(this.__original, [this.__original.length, 0].concat(items));
            this.__change(arrayLength, [], items);
        },
        
        /**
         * Возвращает копию исходного массива
         * @return {Array}
         */
        cloneRawArray: function() {
            return this.__original.concat();
        },
        
        /**
         * Алиас для getArray().forEach(iterator, context)
         * @param {function(*, number)} iterator
         * @param [context=null]
         */
        forEach: function(iterator, context) {
            $.each(this.__original, function(i, item) {
                iterator.call(context || window, item, i);
            });
        },
        
        /**
         * Возвращает исходный массив
         * @return {Array}
         */
        getArray: function() {
            return this.__original;
        },
        
        /**
         * Алиас для getArray()[index]
         * @param {Number} index
         * @return {*}
         */
        getItem: function(index) {
            return this.__original[index];
        },
        
        /**
         * Алиас для getArray().length
         * @return {Number}
         */
        getLength: function() {
            return this.__original.length;
        },
        
        /**
         * Версия массива (количество изменений с момента создания)
         * @returns {number}
         */
        getVersion: function() {
            return this.__version;
        },
        
        /**
         * Алиас для getArray().indexOf(searchElement, fromIndex)
         * @param searchElement
         * @param [fromIndex=0]
         * @return {Number}
         */
        indexOf: function(searchElement, fromIndex) {
            return $.inArray(searchElement, this.__original, fromIndex);
        },
        
        /**
         * Вставка элемента object в позицию index
         * @param {Number} index
         * @param object
         */
        insert: function(index, object) {
            if (index < 0 || index > this.__original.length) {
                throw new RangeError('Выход за границы массива при вставке');
            }
            this.__original.splice(index, 0, object);
            this.__change(index, [], [object]);
        },
        
        /**
         * Отслеживать изменения массива (если в массиве есть элементы, то сразу же запускает callback)
         * @param {function(number, Array, Array)} callback
         * @param {Object} [context]
         * @param {boolean} [updateItem=false]
         * @returns {Function}
         */
        listenChanges: function(callback, context, updateItem) {
            var changeListener = this.on('change', callback, context);
            var updateListener = updateItem ? this.on('updateItem', callback, context) : _.noop;
            callback.call(context || window, 0, [], this.getArray());
            
            return function() {
                changeListener();
                updateListener();
            };
        },
        
        /**
         * Вставка элемента в конец массива
         * @param object
         */
        push: function(object) {
            this.__original.push(object);
            this.__change(this.__original.length - 1, [], [object]);
        },
        
        /**
         * Уведомить об изменении элемента массива
         * @param item
         */
        onUpdateItem: function(item) {
            this.fireEvent('updateItem', item, this.indexOf(item));
        },
        
        /**
         * Уведомить об изменении элемента массива
         * @param {number} index
         */
        onUpdateItemAt: function(index) {
            this.fireEvent('updateItem', this.getItem(index), index);
        },
        
        /**
         * Удаление элемента object. Возвращает true если такой элемент был найден и удалён.
         * @param object
         * @return {Boolean}
         */
        remove: function(object) {
            var index = this.indexOf(object);
            if (index !== -1) {
                this.removeAt(index);
                return true;
            }
            return false;
        },
        
        /**
         * Удаление всех элементов из массива
         */
        removeAll: function() {
            if (this.getLength() > 0) {
                this.splice(0, this.__original.length);
            }
        },
        
        /**
         * Удаление элемента массива в позиции index
         * @param {Number} index
         */
        removeAt: function(index) {
            if (index === -1) {
                return;
            }
            
            var object = this.__original[index];
            this.__original.splice(index, 1);
            this.__change(index, [object], []);
        },
        
        /**
         * Заменить все элементы массива переданными
         * @param {Array} items
         */
        replaceAll: function(items) {
            this.splice.apply(this, [0, this.__original.length].concat(items));
        },
        
        /**
         * Удалить removeCount элементов массива начиная с index и вставить вместо них items. Возвращает массив удалённых
         * элементов.
         * @param {Number} index
         * @param {Number} removeCount
         * @param {Array} items
         * @return {Array}
         */
        replaceRange: function(index, removeCount, items) {
            return this.splice.apply(this, [index, removeCount].concat(items));
        },
        
        /**
         * Удалить первый элемент массива и вернуть его
         * @return {*}
         */
        shift: function() {
            var result = this.__original.shift();
            this.__change(0, [result], []);
            return result;
        },
        
        /**
         * Сортировка
         * @param {function(*, *): number} compare
         */
        sort: function(compare) {
            if (this.getLength() > 0) {
                var sorted = this.cloneRawArray().sort(compare);
                if (!croc.utils.arrEqual(sorted, this.getArray())) {
                    this.replaceAll(sorted);
                }
            }
        },
        
        /**
         * Удалить removeCount элементов массива начиная с index и вставить вместо них varargs. Возвращает массив удалённых
         * элементов.
         * @param {Number} index
         * @param {Number} removeCount
         * @param {...*} varargs
         * @return {Array}
         */
        splice: function(index, removeCount, varargs) {
            var removed = this.__original.splice.apply(this.__original, arguments);
            this.__change(index, removed, Array.prototype.slice.call(arguments, 2));
            return removed;
        },
        
        /**
         * Если item присутствует в коллекции, то удаляет его и возвращает false, иначе добавляет и возвращает true.
         * @param item
         * @param {boolean} [value]
         * @returns {boolean}
         */
        toggleItem: function(item, value) {
            if (value !== undefined) {
                if (value && this.indexOf(item) === -1) {
                    this.push(item);
                    return true;
                }
                else {
                    return !this.remove(item);
                }
            }
            
            if (!this.remove(item)) {
                this.push(item);
                return true;
            }
            return false;
        },
        
        /**
         * Вставить переданные элементы в начало массива
         * @param {...*} varargs
         */
        unshift: function(varargs) {
            this.__original.unshift.apply(this.__original, arguments);
            this.__change(0, [], _.toArray(arguments));
        },
        
        /**
         * @param index
         * @param remove
         * @param insert
         * @private
         */
        __change: function(index, remove, insert) {
            if (remove.length === 0 && insert.length === 0) {
                return;
            }
            ++this.__version;
            this.__checkLength();
            this.fireEvent('change', index, remove, insert);
        },
        
        /**
         * @private
         */
        __checkLength: function() {
            this.__setLength(this.__original.length);
            this.__setEmpty(!this.__original.length);
        }
    }
});