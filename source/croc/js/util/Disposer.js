croc.ns('croc.util');

/**
 * Класс-помощник в освобождении ресурсов и удалении обработчиков.
 * Хранилище обработчиков событий. Все обработчики назначенные с помощью этого хранилища можно удалить разом вызвав
 * метод {@link croc.util.Disposer#disposeAll}.
 */
croc.Class.define('croc.util.Disposer', {
    extend: croc.Object,
    
    properties: {
        bound: {
            apply: function(value) {
                if (!value) {
                    this.__lastState = this.saveState();
                    this.disposeAll();
                }
                else {
                    this.restoreState(this.__lastState ? this.__lastState.concat(this.__items) : this.__items.concat());
                }
            },
            value: true,
            option: true
        }
    },
    
    construct: function() {
        /**
         * @type {Array.<Object>}
         * @private
         */
        this.__items = [];
        
        croc.util.Disposer.superclass.__construct__.apply(this, arguments);
    },
    
    destruct: function() {
        this.disposeAll();
    },
    
    members: {
        /**
         * Создать биндинг свойства prop объекта на свойство targetProp объекта target. Возможно указать mapper для трансформации
         * значения свойства. Возвращает функцию, которая разрывает биндинг при её вызове.
         * @param {croc.IObject} source
         * @param {String} prop
         * @param {Object} target
         * @param {String} targetProp
         * @param {function(*):*} [mapper=null]
         * @param [context=null]
         * @returns {croc.util.Disposer.Descriptor}
         */
        addBinding: function(source, prop, target, targetProp, mapper, context) {
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                obj: source,
                unbinder: this.getBound() && source.bind.call.apply(source.bind, arguments),
                method: 'addBinding',
                args: _.toArray(arguments)
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        addInitializator: function(callback, context) {
            if (this.getBound()) {
                callback.call(context);
            }
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                none: true,
                method: 'addInitializator',
                args: _.toArray(arguments)
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Добавить функцию, которая будет вызывана при очистке обработчиков
         * @param {Function} callback
         * @param {Object} [context]
         * @returns {Object}
         * @returns {croc.util.Disposer.Descriptor}
         */
        addCallback: function(callback, context) {
            if (!this.getBound()) {
                return new croc.util.Disposer.Descriptor(this, {});
            }
            
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                unbinder: context ? callback.bind(context) : callback
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Добавить функции, которая будет вызывана при очистке обработчиков
         * @param {...Function} varargs
         * @returns {Array.<Object>}
         * @returns {croc.util.Disposer.Descriptor}
         */
        addCallbacks: function(varargs) {
            return this.addCallback(_.toArray(arguments));
        },
        
        /**
         * Назначить обработчик события на croc.Object, croc или jQuery объект
         * @param {croc.Object|jQuery|string} obj объект, на событие которого назначается обработчик
         * @param {string|Array} event событие, для метода jQuery#on можно передать массив - [event, selector]
         * @param {Function} listener обработчик
         * @param [context=undefined] контекст
         * @returns {croc.util.Disposer.Descriptor}
         */
        addListener: function(obj, event, listener, context) {
            if (this.getBound()) {
                if (context) {
                    listener = listener.bind(context);
                }
                if (obj === croc) {
                    croc.subscribe(event, listener);
                }
                else if (Array.isArray(event)) {
                    obj.on(event[0], event[1], listener);
                }
                else {
                    obj.on(event, listener);
                }
            }
            
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                obj: obj,
                event: event,
                listener: listener,
                method: 'addListener',
                args: _.toArray(arguments)
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Добавляет обработчики для нескольких событий объекта
         * @param {croc.Object|jQuery|string} obj см. {@link #addListener}
         * @param {Object.<string, Function>} events объект, ключи которого - имена событий, значения - обработчики
         * @param [context=undefined]
         * @returns {Array.<croc.util.Disposer.Descriptor>}
         */
        addListeners: function(obj, events, context) {
            var descriptors = [];
            _.forOwn(events, function(listener, event) {
                descriptors.push(this.addListener(obj, event, listener, context));
            }, this);
            
            return descriptors;
        },
        
        /**
         * Функция, которую возвращает trigger будет вызвана при очищении disposer. trigger будет вызываться каждый раз
         * при setBound(true)
         * @param {function():function} trigger
         * @param [context]
         * @returns {croc.util.Disposer.Descriptor}
         */
        addTrigger: function(trigger, context) {
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                unbinder: (this.getBound() && (context ? trigger.call(context) : trigger())) || _.noop,
                method: 'addTrigger',
                args: _.toArray(arguments)
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Алиас к setTimeout(callback, 0)
         * @param {function} callback
         * @param {Object} [context]
         * @returns {croc.util.Disposer.Descriptor}
         */
        defer: function(callback, context) {
            return this.setTimeout(function() {
                callback.call(context || window);
            }, 0);
        },
        
        /**
         * Удалить все добавленные элементы
         */
        disposeAll: function() {
            var $this = this;
            $.each(this.__items, function(i, desc) {
                $this.disposeItem(desc, false);
            });
            
            this.__items = [];
        },
        
        /**
         * Удалить элемент по его дескриптору
         * @param {Object} descriptor
         * @param {boolean} [removeFromArr=true] internal!
         */
        disposeItem: function(descriptor, removeFromArr) {
            if (!descriptor) {
                return;
            }
            if (!(descriptor instanceof croc.util.Disposer.Descriptor)) {
                throw new TypeError('Передан неверный дескриптор');
            }
            
            if ((removeFromArr === false || croc.utils.arrRemove(this.__items, descriptor)) && !descriptor.none) {
                if (descriptor.interval) {
                    clearInterval(descriptor.interval);
                }
                else if (descriptor.timeout) {
                    clearTimeout(descriptor.timeout);
                }
                else if (descriptor.unbinder) {
                    _.invoke(croc.utils.arr(descriptor.unbinder), 'call', window);
                }
                else if (descriptor.obj === croc) {
                    croc.unsubscribe(descriptor.event, descriptor.listener);
                }
                else if (descriptor.obj instanceof croc.Object) {
                    descriptor.obj.un(descriptor.event, descriptor.listener);
                }
                else if (Array.isArray(descriptor.event)) {
                    descriptor.obj.off(descriptor.event[0], descriptor.event[1], descriptor.listener);
                }
                else {
                    descriptor.obj.off(descriptor.event, descriptor.listener);
                }
            }
            descriptor.remove = _.noop;
        },
        
        /**
         * Есть ли неочищенные элементы
         * @returns {boolean}
         */
        hasItems: function() {
            return !!this.__items.length;
        },
        
        /**
         * Вызывает callback каждый раз, когда значение свойства prop изменяется, а также непосредственно в момент вызова этого
         * метода. Возвращает функцию, которая прекращает прослушивание свойства при её вызове.
         * @param {croc.IObject} source
         * @param {String} prop
         * @param {Function} callback
         * @param [context=null]
         * @returns {croc.util.Disposer.Descriptor}
         */
        listenProperty: function(source, prop, callback, context) {
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                obj: source,
                unbinder: this.getBound() && source.listenProperty.call.apply(source.listenProperty, arguments),
                method: 'listenProperty',
                args: _.toArray(arguments)
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Удалить все обработчики событий определённого объекта
         * @param obj
         */
        removeObject: function(obj) {
            this.__items.concat().forEach(function(desc) {
                if (desc.obj === obj) {
                    this.disposeItem(desc);
                }
            }, this);
        },
        
        restoreState: function(state) {
            this.disposeAll();
            state.forEach(function(item) {
                if (item.method) {
                    this[item.method].apply(this, item.args);
                }
            }, this);
        },
        
        /**
         * @returns {Array}
         */
        saveState: function() {
            return this.__items.concat();
        },
        
        /**
         * Установить интервал вызова функции
         * @param {Function} func
         * @param {number} interval
         * @returns {croc.util.Disposer.Descriptor}
         */
        setInterval: function(func, interval) {
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                interval: this.getBound() && setInterval(func, interval),
                method: 'setInterval',
                args: _.toArray(arguments)
            });
            
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Установить таймаут вызова функции
         * @param {Function} func
         * @param {number} timeout
         * @returns {croc.util.Disposer.Descriptor}
         */
        setTimeout: function(func, timeout) {
            var descriptor = new croc.util.Disposer.Descriptor(this, {
                interval: this.getBound() && setTimeout(function() {
                    func();
                    croc.utils.arrRemove(this.__items, descriptor);
                }.bind(this), timeout),
                method: 'setTimeout',
                args: _.toArray(arguments)
            });
            this.__items.push(descriptor);
            
            return descriptor;
        },
        
        /**
         * Создаёт функцию, вызов которой будет запрещён после очищения disposer
         * @param {function} func
         * @param [context]
         * @returns {Function}
         */
        wrapFunc: function(func, context) {
            var allowed = false;
            this.addInitializator(function() {
                allowed = true;
                this.addCallback(function() {
                    allowed = false;
                });
            }, this);
            
            return function() {
                return allowed ? func.apply(context || this, arguments) : undefined;
            };
        }
    }
});

/**
 * @param {croc.util.Disposer} disposer
 * @param config
 * @constructor
 */
croc.util.Disposer.Descriptor = function(disposer, config) {
    this.disposer = disposer;
    _.assign(this, config);
    
    if (!disposer.getBound()) {
        config.none = true;
    }
};

croc.util.Disposer.Descriptor.prototype.remove = function() {
    this.disposer.disposeItem(this);
};
