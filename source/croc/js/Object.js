var EventEmitter = require('events').EventEmitter;

/**
 * Common parent object
 */
croc.Class.define('croc.Object', {
    extend: EventEmitter,
    implement: croc.IObject,
    
    statics: {
        /**
         * @private
         */
        __marshalClasses: {},
        
        /**
         * Возвращает на основе переданного объекта, модель, в которой свойства соответствуют полям этого объекта (маршалинг)
         * При этом значения свойств также подвергаются маршалингу
         * Если передан массив, то будет возвращён croc.data.ObservableArray
         * @param {Object|Array|*} obj
         * @param {boolean} [deep=true]
         * @returns {croc.Object|croc.data.ObservableArray|*}
         */
        createModel: function(obj, deep) {
            if (obj && (obj instanceof croc.Object)) {
                return obj;
            }
            
            if (deep === undefined) {
                deep = true;
            }
            
            if (Array.isArray(obj)) {
                return new croc.data.ObservableArray({
                    original: deep ? obj.map(function(x) { return croc.Object.createModel(x); }) : obj
                });
            }
            
            if (!_.isPlainObject(obj)) {
                return obj;
            }
            
            var properties = Object.keys(obj);
            var id = properties.sort().join('__marshal_delimiter__');
            var Cls = this.__marshalClasses[id];
            
            if (!Cls) {
                var config = {
                    extend: croc.Object,
                    construct: function(options) {
                        properties.forEach(function(property) {
                            if (property in options) {
                                this.setProperty(property,
                                    deep ? croc.Object.createModel(options[property]) : options[property]);
                            }
                        }, this);
                    },
                    properties: {},
                    options: {}
                };
                
                _.forOwn(obj, function(val, key) {
                    config.properties[key] = {event: true};
                    config.options[key] = null;
                });
                
                Cls = this.__marshalClasses[id] = croc.Class.define(null, config);
            }
            
            return new Cls(obj);
        },
        
        /**
         * Возвращает имя геттера, сеттера или события для свойства
         * @param {string} part get|set|change
         * @param {string} property
         * @returns {string}
         */
        getPropertyPart: function(part, property) {
            var prefix = '';
            property = property.replace(/^_{0,2}/, function(match) {
                prefix = match;
                return '';
            });
            
            return prefix + part + property[0].toUpperCase() + property.slice(1);
        },
        
        /**
         * Прослушивание нескольких свойств одной функцией
         * @param {croc.IObject} source
         * @param {String} sourceProperty
         * @param {Function} callback
         * @param {Object} [context=null]
         * @return {Function}
         */
        listenProperties: function(source, sourceProperty, /*source2, source2Property, ...*/callback, context) {
            var sources;
            if (Array.isArray(source)) {
                sources = source;
                context = callback;
                callback = sourceProperty;
            }
            else {
                sources = [];
                
                for (var i = 1; i - 1 < arguments.length; i += 2) {
                    var curSource = arguments[i - 1];
                    var curSourceProperty = arguments[i];
                    if (typeof curSourceProperty !== 'string') {
                        callback = curSource;
                        context = curSourceProperty;
                        break;
                    }
                    
                    sources.push([curSource, curSourceProperty]);
                }
            }
            
            if (!context) {
                context = window;
            }
            
            var onChange = function(index) {
                var args = sources.map(function(source, j) {
                    return !source[0] ? undefined :
                        source[1][0] === ':' ? index === j :
                            source[0][croc.Object.getPropertyPart('get', source[1])]();
                });
                callback.apply(context, args);
            };
            
            var unbinders = sources.map(function(source, i) {
                if (source[0]) {
                    return source[0].listenProperty(source[1], _.partial(onChange, i));
                }
                else {
                    onChange(i);
                    return _.noop;
                }
            });
            
            return function() {
                unbinders.forEach(function(x) { x(); });
            };
        },
        
        /**
         * Мерджинг конфигураций для объектов. Умно мерджит секцию listeners, сохраняя все обработчики.
         * @param {Object} target
         * @param {Object} source
         * @returns {Object}
         */
        mergeConf: function(target, source) {
            if (!source) {
                return target;
            }
            
            var listeners;
            if (target.listeners && source.listeners) {
                listeners = _.assign({}, target.listeners);
                _.forOwn(source.listeners, function(listener, event) {
                    if (listeners[event]) {
                        var targetListener = listeners[event];
                        listeners[event] = function() {
                            targetListener.apply(this, arguments);
                            listener.apply(this, arguments);
                        };
                    }
                    else {
                        listeners[event] = listener;
                    }
                });
            }
            
            _.assign(target, source);
            if (listeners) {
                target.listeners = listeners;
            }
            
            return target;
        },
        
        /**
         * Обеспечивает биндинг нескольких свойств различных объектов на одно свойство targetProperty объекта target
         * @param {croc.IObject} source
         * @param {String} sourceProperty
         * @param {Object} target
         * @param {String} targetProperty
         * @param {Function} converter
         * @param {Object} [context=null]
         * @return {Function}
         */
        multiBind: function(source, sourceProperty, /*source2, source2Property, ...*/target, targetProperty, converter,
                            context) {
            var sources;
            if (Array.isArray(source)) {
                sources = source;
                context = converter;
                converter = targetProperty;
                targetProperty = target;
                target = sourceProperty;
            }
            else {
                var args = _.toArray(arguments);
                var tailLength = typeof args[args.length - 3] === 'string' ? 4 : 3;
                var tail = args.slice(args.length - tailLength);
                var sourcesPairs = args.slice(0, args.length - tailLength);
                target = tail[0];
                targetProperty = tail[1];
                converter = tail[2];
                context = tail[3];
                
                sources = [];
                for (var i = 0; i < sourcesPairs.length; i += 2) {
                    sources.push([sourcesPairs[i], sourcesPairs[i + 1]]);
                }
            }
            
            if (!context) {
                context = window;
            }
            
            var setter = croc.Object.getPropertyPart('set', targetProperty);
            //noinspection JSCheckFunctionSignatures,JSValidateTypes
            return croc.Object.listenProperties(sources, function() {
                target[setter](converter.apply(context, arguments));
            });
        },
        
        /**
         * Связывает свойства объектов в обе стороны
         * @param {croc.IObject} source
         * @param {string} sourceProperty
         * @param {croc.IObject} target
         * @param {string} targetProperty
         * @param {function(*):*} [sourceToTargetMapper=undefined]
         * @param {function(*):*} [targetToSourceMapper=undefined]
         * @param {Object} [context=undefined]
         * @param {Boolean} [reversed=false]
         * @returns {Function}
         */
        twoWaysBinding: function(source, sourceProperty, target, targetProperty, sourceToTargetMapper,
                                 targetToSourceMapper, context, reversed) {
            if (_.last(arguments) === true) {
                return this.twoWaysBinding.apply(this, [
                    target, targetProperty, source, sourceProperty,
                    typeof targetToSourceMapper === 'function' && targetToSourceMapper,
                    typeof sourceToTargetMapper === 'function' && sourceToTargetMapper,
                    typeof context !== 'boolean' && context]);
            }
            if (context) {
                if (sourceToTargetMapper) {
                    sourceToTargetMapper = sourceToTargetMapper.bind(context);
                }
                if (targetToSourceMapper) {
                    targetToSourceMapper = targetToSourceMapper.bind(context);
                }
            }

//            function getName(target) {
//                return target instanceof croc.ui.form.field.TextField ? 'textfield' : target instanceof croc.ui.map.MultiMap ? 'multimap' : target instanceof croc.ui.map.YandexMap ? 'yandexmap' : 'unknown';
//            }
            
            var ignoreValue = {};
            
            function bind(source, sourceProperty, target, targetProperty, mapper, unmapper, context) {
                var targetGetter = croc.Object.getPropertyPart('get', targetProperty);
                var targetSetter = croc.Object.getPropertyPart('set', targetProperty);
                var sourceGetter = croc.Object.getPropertyPart('get', sourceProperty);
                var sourceSetter = croc.Object.getPropertyPart('set', sourceProperty);
                return source.listenProperty(sourceProperty, function(value) {
                    if (target.getUniqueId() in ignoreValue) {
                        delete ignoreValue[target.getUniqueId()];
                        return;
                    }
                    
                    var oldTargetValue = target[targetGetter]();
                    if (mapper) {
                        value = mapper(value, oldTargetValue);
                    }
                    
                    ignoreValue[source.getUniqueId()] = value;
                    target[targetSetter](value);
                    delete ignoreValue[source.getUniqueId()];
                    
                    var newValue = target[targetGetter]();
                    if (newValue !== value) {
                        var sourceValue = unmapper ? unmapper(newValue, source[sourceGetter]()) : newValue;
                        
                        ignoreValue[target.getUniqueId()] = sourceValue;
                        source[sourceSetter](sourceValue);
                        delete ignoreValue[target.getUniqueId()];
                    }
                });
            }
            
            var sourceUnbinder = bind(source, sourceProperty, target, targetProperty, sourceToTargetMapper,
                targetToSourceMapper);
            var targetUnbinder = bind(target, targetProperty, source, sourceProperty, targetToSourceMapper,
                sourceToTargetMapper);
            return function() {
                sourceUnbinder();
                targetUnbinder();
            };
        }
    },
    
    events: {
        /**
         * Объект был разрушен
         */
        dispose: null
    },
    
    options: {
        /**
         * Проверять ли наличие события при попытке его возбуждения, подписки на него
         * @type {boolean}
         */
        checkEvents: true,
        
        /**
         * Объект с обработчиками событий объекта
         * @type {Object}
         */
        listeners: {
            value: {}
        },
        
        /**
         * Метод вызывает до конструирования объекта, но после создания ссылки на него. Можно использовать тогда,
         * когда ссылка на объект нужна внешней среде до его полного конструирования.
         * @type {function(croc.Object)}
         */
        onPreConstruct: null
    },
    
    members: {
        /**
         * Подписаться на событие
         * @param {string} eventName
         * @param {Function|Object} [callback=null]
         * @param {Object} [context=null]
         * @returns {croc.Object}
         */
        addListener: function(eventName, callback, context) {
            if (this._maxListeners !== 0) {
                this._maxListeners = 0;
            }
            
            if (context) {
                var oldCallback = callback;
                callback = callback.bind(context);
                callback.listener = oldCallback;
            }
            
            this.__checkEventExists(eventName);
            if (!this.__stmObjEvents) {
                this.__stmObjEvents = {};
            }
            if (!this.__stmObjEvents[eventName]) {
                this._initEvent(eventName);
                this.__stmObjEvents[eventName] = true;
            }
            
            croc.Object.superclass.addListener.call(this, eventName, callback);
            
            return this;
        },
        
        /**
         * Создать биндинг свойства prop объекта на свойство targetProp объекта target. Возможно указать mapper для трансформации
         * значения свойства. Возвращает функцию, которая разрывает биндинг при её вызове.
         * @param {String} prop
         * @param {Object} target
         * @param {String} targetProp
         * @param {function(*):*} [mapper=null]
         * @param [context=null]
         * @return {Function}
         */
        bind: function(prop, target, targetProp, mapper, context) {
            var setter = croc.Object.getPropertyPart('set', targetProp);
            
            return this.listenProperty(prop, function(newValue, oldValue) {
                target[setter](mapper ? mapper.call(context || this, newValue, oldValue) : newValue);
            }, this);
        },
        
        /**
         * Удалить все обработчики событий объекта
         * @param {string} [event]
         */
        clearListeners: function(event) {
            this.__checkEventExists(event);
            this.removeAllListeners(event);
        },
        
        /**
         * @param {function} func
         * @param [context]
         * @param {number} [wait]
         * @returns {Function}
         */
        debounce: function(func, context, wait) {
            if (typeof context === 'number') {
                wait = context;
                context = null;
            }
            if (!wait) {
                wait = 0;
            }
            return _.debounce(this._getDisposer().wrapFunc(func, context), wait);
        },
        
        /**
         * Создаёт функцию, вызов которой будет запрещён после разрушения объекта
         * @param {function} func
         * @param [context]
         * @returns {Function}
         */
        disposableFunc: function(func, context) {
            return this._getDisposer().wrapFunc(func, context);
        },
        
        /**
         * Очистка объекта. Не перегружать! Использовать destruct.
         */
        dispose: function() {
            if (this.__stmObjDisposer) {
                this.__stmObjDisposer.disposeAll();
            }
            this.__stmObjDisposed = true;
            this.fireEvent('dispose');
        },
        
        /**
         * Возбудить событие
         * @param {string} event
         * @returns {*}
         */
        emit: function(event) {
            this.__checkEventExists(event);
            croc.Object.superclass.emit.apply(this, arguments);
        },
        
        /**
         * Возбудить событие изменения свойства
         * @param {string} property
         * @param value
         * @param oldValue
         */
        fireChangeProperty: function(property, value, oldValue) {
            this.fireEvent(croc.Object.getPropertyPart('change', property), value, oldValue);
        },
        
        /**
         * Возбудить событие
         * @param {string} event
         * @returns {*}
         */
        fireEvent: function(event) {
            this.emit.apply(this, arguments);
        },
        
        /**
         * Получить значение свойства по его имени
         * @param {string} property
         * @returns {*}
         */
        getProperty: function(property) {
            return this[croc.Object.getPropertyPart('get', property)]();
        },
        
        /**
         * Возвращает уникальный id объекта
         * @returns {Number}
         */
        getUniqueId: function() {
            return croc.utils.objUniqueId(this);
        },
        
        /**
         * Возвращает хранилище пользовательских данных (объект) ассоциированное с переданным объектом. Хранилище
         * уничтожается вместе с данным объектом (forObject).
         * @param {Object} [forObject]
         * @returns {Object}
         */
        getUserData: function(forObject) {
            return croc.utils.objUserData(this, forObject);
        },
        
        /**
         * Есть ли обработчики данного события
         * @param {string} event
         */
        hasListeners: function(event) {
            return EventEmitter.listenerCount(this, event) > 0;
        },
        
        /**
         * Разрушен ли объект
         * @returns {boolean}
         */
        isDisposed: function() {
            return !!this.__stmObjDisposed;
        },
        
        /**
         * Вызывает callback каждый раз, когда значение свойства prop изменяется, а также непосредственно в момент вызова этого
         * метода. Возвращает функцию, которая прекращает прослушивание свойства при её вызове.
         * @param {String} prop
         * @param {Function} callback
         * @param [context=null]
         * @return {Function}
         */
        listenProperty: function(prop, callback, context) {
            //если начинается с :, то это событие
            var isEvent = prop[0] === ':';
            if (isEvent) {
                prop = prop.slice(1);
            }
            
            var event = isEvent ? prop : croc.Object.getPropertyPart('change', prop);
            var curValue = isEvent ? null : this.getProperty(prop);
            
            var handler = function(value, oldValue, internal) {
                if (isEvent) {
                    callback.apply(context || this, arguments);
                }
                else if (value !== curValue) {
                    curValue = value;
                    callback.call(context || this, value, oldValue, internal);
                }
            };
            this.on(event, handler, this);
            if (!isEvent) {
                callback.call(context || this, curValue, curValue);
            }
            
            return function() {
                this.un(event, handler, this);
            }.bind(this);
        },
        
        /**
         * Подписаться на событие
         * @param {string|Object.<string, Function>} eventName
         * @param {Function|Object} [callback=null]
         * @param {Object} [context=null]
         * @returns {function|undefined}
         */
        on: function(eventName, callback, context) {
            if (typeof eventName === "object") {
                var events = eventName;
                context = callback;
                _.forOwn(eventName, function(value, event) {
                    if (typeof events[event] === "function") {
                        // shared options
                        this.on(event, events[event], context);
                    }
                    else if (event !== 'scope') {
                        // individual options
                        this.on(event, events[event].fn, events[event].scope || context);
                    }
                }, this);
                return;
            }
            
            this.addListener(eventName, callback, context);
            
            var self = this;
            return function() {
                self.removeListener(eventName, callback);
            };
        },
        
        /**
         * Подписаться на событие изменения значения свойства
         * @param {string} property
         * @param {function(*, *)} callback
         * @param [context]
         */
        onChangeProperty: function(property, callback, context) {
            this.on(croc.Object.getPropertyPart('change', property), callback, context);
        },
        
        /**
         * Добавить обработчик события, который будет удалён при первом вызове
         * @param {string} event
         * @param {Function} fn
         * @param [context=null]
         * @return {function}
         */
        once: function(event, fn, context) {
            var listener;
            var func = function() {
                listener();
                return fn.apply(this, arguments);
            };
            
            listener = this.on(event, func, context);
            return listener;
        },
        
        /**
         * Удаляет хранилище возвращённое методом {@link #getUserData}
         * @param {Object} [forObject]
         */
        removeUserData: function(forObject) {
            return croc.utils.objRemoveUserData(this, forObject);
        },
        
        /**
         * @param type
         * @param listener
         */
        removeListener: function removeListener(type, listener) {
            croc.Object.superclass.removeListener.call(this, type, listener.listener || listener);
        },
        
        /**
         * @param property
         * @param value
         * @param [internal]
         */
        setProperty: function(property, value, internal) {
            this[croc.Object.getPropertyPart('set', property)](value, internal);
        },
        
        /**
         * Unsubscribe from a given event.
         * @param {string|function} eventName
         * @param {function} [fn]
         */
        un: function(eventName, fn) {
            if (typeof eventName === 'function') {
                eventName();
            }
            else {
                this.__checkEventExists(eventName);
                this.removeListener(eventName, fn);
            }
        },
        
        /**
         * Check if all required options has been configured.
         * @param {Object} options
         * @protected
         */
        _checkMissedOptions: function(options) {
            _.forOwn(this.$$missedRequiredOptions, function(x, optionName) {
                if (!(optionName in options)) {
                    throw new Error('Option "' + optionName + '" is required for creation of class instance"' + this.constructor.classname + '"');
                }
            }, this);
        },
        
        /**
         * Возвращает Disposer для объекта, который очищается при очищении объекта
         * @returns {croc.util.Disposer}
         * @protected
         */
        _getDisposer: function() {
            return this.__stmObjDisposer || (this.__stmObjDisposer = new croc.util.Disposer());
        },
        
        /**
         * Метод вызывается перед тем, как добавляется первый обработчик события
         * @param {string} event
         * @protected
         */
        _initEvent: function(event) {
        },
        
        /**
         * @param event
         * @private
         */
        __checkEventExists: function(event) {
            if (!this.$$compatibilityMode && this._options && this._options.checkEvents && !this['$$event-' + event]) {
                throw new Error('Событие ' + event + ' в классе ' + this.constructor.classname + ' не зарегистрировано.');
            }
        }
    }
});
