//+use $.history

/**
 * Сервис истории браузера. Ожидается что хеш адресной строки будет соответствовать шаблону: name1=value1&name2=value2&...
 */
croc.Class.define('croc.services.History', {
    extend: croc.Object,
    
    events: {
        /**
         * Был изменён один из параметров хеша
         * @param {string} name
         * @param {string} value
         * @param {string} old
         */
        changeParam: null
    },
    
    properties: {
        /**
         * Объект со всеми параметрами хеша
         * @type {Object}
         */
        params: {
            field: '__params',
            apply: function(params, old, _internal) {
                if (!_internal) {
                    this.__sync();
                }
            },
            event: true
        }
    },
    
    construct: function(options) {
        this.__paramProps = {};
        this.__contexts = {};
        this.__params = {};
        this.__weights = {};
        this.__lastWeight = 0;
        
        if (croc.isClient) {
            var firstTime = !!location.hash;
            $.history.init(function(hash) {
                this.__weights = _.zipObject(hash.split('&').map(function(pair) {
                    return [pair.split('=')[0], ++this.__lastWeight];
                }, this));
                
                if (firstTime) {
                    this.__params = this.__deserializeParams(hash);
                    firstTime = false;
                }
                else {
                    var paramsRest = _.clone(this.__params);
                    _.forOwn(this.__deserializeParams(hash), function(value, param) {
                        this.setParam(param, value, true);
                        delete paramsRest[param];
                    }, this);
                    _.forOwn(paramsRest, function(value, param) {
                        if (param[0] !== '_') {
                            this.setParam(param, null, true);
                        }
                    }, this);
                    this.__sync();
                }
                this.setParams(_.clone(this.__params), true);
            }.bind(this));
        }
        
        croc.services.History.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * Объект со свойствами зарегистрированными через {@link #registerParam}, на которые можно выполнять биндинг
         * @return {croc.Object}
         */
        getObservable: function() {
            return this.__observable || (this.__observable = new croc.Object());
        },
        
        /**
         * Получить значение параметра
         * @param {string} name
         * @return {*}
         */
        getParam: function(name) {
            return this.__params[name] || null;
        },
        
        /**
         * Возвращает disposer, свойство которого bound равно true при значении контекста равном текущему и false иначе
         * @param {string} context
         * @param {croc.util.Disposer} [globalDisposer]
         * @returns {croc.util.Disposer}
         */
        getContextDisposer: function(context, globalDisposer) {
            var disposer = new croc.util.Disposer();
            var value = this.getParam(context);
            (globalDisposer ? globalDisposer.addListener : this.on)
                .call(globalDisposer || this, 'changeParam', function(name, newValue) {
                    disposer.setBound(newValue === value);
                });
            return disposer;
        },
        
        /**
         * Вызывать callback при изменении параметра с именем name
         * @param {string} name
         * @param {function(*, *)} callback
         * @param [context]
         */
        listenParam: function(name, callback, context) {
            callback(this.getParam(name), null);
            return this.on('changeParam', function(param, value, old) {
                if (param === name) {
                    callback.call(context || window, value, old);
                }
            });
        },
        
        /**
         * Регистрирует свойство через {@link #registerParam} и устанавливает его прослушивание через listenProperty
         * @param {string} name
         * @param {function} listener
         * @param [context]
         * @returns {Function}
         */
        registerAndListen: function(name, listener, context) {
            this.registerParam(name);
            return this.getObservable().listenProperty(name, listener, context);
        },
        
        /**
         * Регистрирует параметр как свойство {@link #getObservable}
         * @param {string} name
         * @param {Object} [options]
         * @param [options.initialValue] установить значение по-умолчанию, если другого значения нет
         * @param [options.initialValueOnEmptyHash] значение по-умолчанию если хеш становится пустым
         * @param {boolean} [options.dontChangeHash=false] не изменять hash страницы пока не будет изменено
         * соответствующее свойство observable
         * {name}ChangesHash
         */
        registerParam: function(name, options) {
            if (this.__paramProps[name]) {
                return;
            }
            this.__paramProps[name] = true;
            if (!options) {
                options = {};
            }
            
            var observable = this.getObservable();
            croc.Class.createProperty(name + 'ChangesHash', {value: !options.dontChangeHash}, observable);
            
            croc.Class.createProperty(name, {
                apply: function(value, old, internal) {
                    if (!internal && observable.getProperty(name + 'ChangesHash')) {
                        this.setParam(name, value);
                    }
                }.bind(this),
                transform: function(value) {
                    return !value && options.initialValue && options.initialValueOnEmptyHash ?
                        options.initialValue : value;
                }.bind(this),
                value: this.getParam(name),
                event: true
            }, observable);
            
            if (!observable.getProperty(name) && options.initialValue) {
                observable.setProperty(name, options.initialValue);
            }
        },
        
        /**
         * Установить значение параметра. Если value === true, то в хеш значение сериализутся просто как name (иначе
         * как name=value)
         * @param {string} name
         * @param value
         * @param {boolean} [internal=false]
         */
        setParam: function(name, value, internal) {
            if (!value) {
                value = null;
            }
            
            var old = this.__params[name] || null;
            if ((!(name in this.__params) && value) || old !== value) {
                //сохраняем параметры старого контекста
                var dependencies = this.__contexts[name + '=' + (old || '')];
                if (dependencies) {
                    _.forOwn(dependencies, function(value, param) {
                        if (value !== undefined) {
                            dependencies[param] = this.getParam(param);
                        }
                        this.setParam(param, null, true);
                    }, this);
                }
                
                if (value) {
                    this.__params[name] = value;
                }
                else {
                    delete this.__params[name];
                }
                
                this.fireEvent('changeParam', name, value, old);
                if (this.__paramProps[name]) {
                    this.getObservable().setProperty(name, value, true);
                }
                
                if (old === null) {
                    this.__weights[name] = ++this.__lastWeight;
                }
                else if (value === null) {
                    delete this.__weights[name];
                }
                
                //восстанавливаем параметры нового контекста
                dependencies = this.__contexts[name + '=' + (value || '')];
                if (dependencies) {
                    _.forOwn(dependencies, function(value, param) {
                        this.setParam(param, value, true);
                    }, this);
                }
                
                if (!internal) {
                    this.__sync();
                }
            }
        },
        
        /**
         * Установить контекст для параметра. Когда контекст сменяется, то параметр удаляется. Когда контекст возвращается к
         * текущему значению, то при переданном параметре restore=true параметр восстанавливается.
         * @param {string} param
         * @param {string} context
         * @param {boolean} [restore=false]
         */
        setParamContext: function(param, context, restore) {
            var contextValue = this.getParam(context);
            var key = context + '=' + (contextValue || '');
            if (!this.__contexts[key]) {
                this.__contexts[key] = {};
            }
            this.__contexts[key][param] = restore ? null : undefined;
        },
        
        /**
         * @param {Object} [hash]
         * @return {Object}
         * @private
         */
        __deserializeParams: function(hash) {
            return _((hash === undefined ? location.hash.substr(1) : hash).split('&'))
                .compact().invoke('split', '=')
                .map(function(x) {
                    return x.length === 1 ? x.concat([true]) : x;
                })
                .zipObject()
                .transform(function(result, value, key) {
                    if (value) {
                        result[key] = value;
                    }
                }).value();
        },
        
        /**
         * @private
         */
        __sync: function() {
            if (!_.isEqual(this.__deserializeParams(), this.__params)) {
                $.history.load(_(this.__params).pairs()
                    .filter(function(x) { return x[0][0] !== '_'; })
                    .sortBy(function(x) { return this.__weights[x[0] || 0]; }, this)
                    .map(function(x) { return x[1] === true ? [x[0]] : x; })
                    .invoke('join', '=')
                    .value().join('&'));
            }
        }
    }
});