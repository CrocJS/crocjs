//+require all

/**
 * todo remove compatibility mode
 */
croc.define('croc.Class', {
    __STANDARD_TYPES: {
        'number': true,
        'string': true,
        'object': true,
        'boolean': true,
        'array': true,
        'function': true,
        'integer': true
    },
    
    /**
     * hash classes
     */
    classes: {},
    
    /**
     * If object is an instance of a class. Also class can be passed as string.
     * @param {Object} obj
     * @param {String|Function} cls
     */
    check: function(obj, cls) {
        if (typeof cls === 'string') {
            cls = croc.Class.getClass(cls);
        }
        return !!cls && obj instanceof cls;
    },
    
    /**
     * Check conformity with the type of value
     * @param {Object} type
     * @param value
     * @param [throwError=true]
     * @param [className]
     * @param [propName]
     */
    checkType: function(type, value, throwError, className, propName) {
        if (value !== null) {
            var isOptions = _.isPlainObject(type);
            
            /**
             * @param [addMessage]
             * @return {boolean}
             */
            var throwErrorFn = function(addMessage) {
                if (throwError === undefined || throwError) {
                    throw new TypeError('' +
                    'Тип переданного значения некорректен! value = ' + value + '. ' +
                    (addMessage || '') +
                    (propName ? ' (' + className + '#' + propName + ')' : ''));
                }
                return false;
            };
            
            if (isOptions && type.check) {
                var typeCheckIsFn = typeof type.check === 'function';
                if ((typeCheckIsFn && !type.check(value)) || (!typeCheckIsFn && type.check.indexOf(value) === -1)) {
                    return throwErrorFn(Array.isArray(type.check) ? ' Возможные значения: [' + type.check.join(', ') + ']' : null);
                }
            }
            
            var checkType = isOptions ? type.type : type;
            if (checkType === undefined) {
                return;
            }
            
            if (Array.isArray(checkType)) {
                if (type.type.every(function(type) { return !this.checkType(type, value, false); }, this)) {
                    return throwErrorFn();
                }
            }
            else {
                if (typeof checkType === 'string' && !croc.Class.__STANDARD_TYPES[checkType]) {
                    checkType = croc.Class.getClass(checkType);
                    if (!checkType) {
                        checkType = {name: isOptions ? type.type : type, $$iface: true};
                    }
                    if (isOptions) {
                        type.type = checkType;
                    }
                }
                if (typeof checkType === 'object' && checkType.$$iface ? !croc.Interface.check(value, checkType.name) :
                        checkType === 'integer' ? typeof value !== 'number' || value % 1 === 0 :
                            checkType === 'array' ? !Array.isArray(value) :
                                typeof checkType === 'string' ? typeof value !== checkType :
                                    !(checkType === Element ? _.isElement(value) : value instanceof checkType)) {
                    return throwErrorFn('Требуемый тип: ' + (checkType.classname || checkType.name || checkType));
                }
            }
        }
        
        return true;
    },
    
    /**
     * Create property for an object
     * @param name
     * @param prop
     * @param dest
     * @param [Cls]
     */
    createProperty: function(name, prop, dest, Cls) {
        if (!prop) {
            prop = {getter: null, setter: null};
        }
        if (typeof prop === 'string') {
            prop = {field: prop, getter: null, setter: null};
        }
        
        prop.name = name;
        if (prop.inherit && Cls) {
            this._inheritProperty(prop, Cls);
        }
        
        var getterPrefix = ('__getter' in prop && '__') || ('_getter' in prop && '_') || ('getter' in prop && '');
        var setterPrefix = ('__setter' in prop && '__') || ('_setter' in prop && '_') || ('setter' in prop && '');
        
        if (getterPrefix === false) {
            getterPrefix = '';
            prop.getter = null;
        }
        
        if (setterPrefix === false) {
            setterPrefix = '';
            prop.setter = null;
        }
        
        var ucfPropName = croc.utils.strUcFirst(name);
        
        //getter
        var getter = getterPrefix === '__' ? prop.__getter :
            getterPrefix === '_' ? prop._getter : getterPrefix === '' ? prop.getter : false;
        
        if (getter !== false) {
            prop.getterName = getterPrefix + 'get' + ucfPropName;
            dest[prop.getterName] =
                croc.Class.__createPropertyGetter(getter, prop);
        }
        
        //event
        if (prop.event) {
            prop.event = getterPrefix + 'change' + ucfPropName;
            dest['$$event-' + prop.event] = true;
        }
        
        //setter
        var setter = setterPrefix === '__' ? prop.__setter :
            setterPrefix === '_' ? prop._setter : setterPrefix === '' ? prop.setter : false;
        
        if (setter !== false) {
            prop.setterName = setterPrefix + 'set' + ucfPropName;
            dest[prop.setterName] =
                croc.Class.__createPropertySetter(setter, prop, Cls);
        }
        
        //inital value
        var field = prop.field || '$$prop-' + name;
        if ('value' in prop) {
            dest[field] = prop.value;
        }
        else if (!(field in dest)) {
            dest[field] = null;
        }
        
        //add option
        if (prop.option && Cls) {
            var config = Cls.config;
            var propOption = typeof prop.option === 'object' ? prop.option : {};
            propOption.name = propOption.name || (typeof prop.option === 'string' ? prop.option : name);
            propOption.property = setterPrefix + name;
            
            var oldOption = config.options[propOption.name];
            if (oldOption && !_.isPlainObject(oldOption)) {
                oldOption = {value: oldOption};
            }
            propOption = config.options[propOption.name] = oldOption ?
                _.assign({}, propOption, oldOption) : propOption;
            if ('value' in prop) {
                propOption.value = prop.value;
            }
        }
        
        return prop;
    },
    
    deferredConstruction: function(instance, options, args) {
        var Cls = instance.constructor;
        var config = Cls.config;
        instance._options = options;
        instance._options = options = croc.Class.__preConstructor.call(instance, config, options || {});
        instance.$$preConstructed = true;
        if (instance.$$compatibilityConstructor) {
            Cls.prototype.__construct__.apply(instance, args);
        }
        else {
            Cls.prototype.__construct__.call(instance, options);
        }
        croc.Class.__postConstructor.call(instance, config, options);
    },
    
    /**
     * @param name
     * @param config
     * @param {boolean} [compatibilityMode=false] internal!
     * @returns {Function}
     */
    define: function(name, config, compatibilityMode) {
        if (this.classes[name]) {
            return this.classes[name];
        }
        
        if (!compatibilityMode && config.type === 'native') {
            return this.__createNativeClass(name, config);
        }
        
        this.__callPreClassCreate(name, config);
        
        var Cls;
        if (config.type === 'static') {
            Cls = function() {
                throw new Error('Нельзя инстанцировать статический класс "' + name + '"');
            };
            if (config.statics) {
                _.assign(Cls, config.statics);
            }
            this.__saveClass(name, Cls);
            return Cls;
        }
        
        if (!config.options) {
            config.options = {};
        }
        if (!config.properties) {
            config.properties = {};
        }
        if (config.implement && !Array.isArray(config.implement)) {
            config.implement = [config.implement];
        }
        if (config.include && !Array.isArray(config.include)) {
            config.include = [config.include];
        }
        
        //base class, constructor
        var baseCls = config.extend;
        if (!baseCls) {
            throw new Error('Не указан базовый класс для класса "' + name + '"');
        }
        
        Cls = function() {
            var options = this._options = arguments[0];
            if (!(this instanceof Cls)) {
                throw new Error('Инстанция класса конструируется только с new (' + name + ')');
            }
            if (Cls.isMixin) {
                throw new Error('Нельзя конструировать миксин: "' + name + '"');
            }
            if (config.type === 'abstract') {
                throw new Error('Нельзя конструировать абстрактный класс: "' + name + '"');
            }
            if (this.$$compatibilityConstructor) {
                options = {};
            }
            if (options && options.onPreConstruct) {
                options.onPreConstruct.call(this, this);
            }
            if (!this.$$deferConstruct) {
                croc.Class.deferredConstruction(this, options, arguments);
            }
        };
        
        //save data
        Cls.classname = name;
        Cls.config = config;
        Cls.baseclass = baseCls;
        
        //statics
        if (config.statics) {
            _.assign(Cls, config.statics);
        }
        
        //inheritance
        if (baseCls && baseCls !== Object) {
            this.inherit(Cls, baseCls);
        }
        
        if (compatibilityMode) {
            Cls.prototype.$$compatibilityMode = true;
            Cls.compatibilityMode = true;
            if (baseCls && baseCls.prototype.__construct__ && !baseCls.prototype.hasOwnProperty('init')) {
                baseCls.prototype.init = function() {
                    baseCls.prototype.__construct__.call(this, this);
                };
            }
        }
        
        //prototype
        if (config.members) {
            _.assign(Cls.prototype, config.members);
        }
        
        //save construct to prototype
        Cls.prototype.construct = Cls.prototype.__construct__ =
            config.construct || baseCls.prototype.__construct__ || baseCls;
        
        //interfaces
        if (config.implement) {
            config.implement.forEach(function(iface) {
                _.assign(Cls.prototype, iface.ifacesMix);
            });
        }
        
        //events
        if (config.events) {
            for (var event in config.events) {
                if (config.events.hasOwnProperty(event)) {
                    Cls.prototype['$$event-' + event] = true;
                }
            }
        }
        
        //mixins
        config.mixins = baseCls.config && baseCls.config.mixins ?
            baseCls.config.mixins.concat(config.include || []) : config.include || [];
        if (config.include) {
            var mixMembers = {};
            config.include.forEach(function(mixin) {
                var propName;
                
                //todo compatibility mode
                if (!mixin.classname) {
                    for (propName in mixin) {
                        if (!Cls.prototype[propName]) {
                            Cls.prototype[propName] = mixin[propName];
                        }
                    }
                    return;
                }
                
                for (propName in mixin.prototype) {
                    if (!Cls.prototype[propName]) {
                        mixMembers[propName] = mixin.prototype[propName];
                    }
                }
                
                var mixinOptions = mixin.config.options;
                for (var optionName in mixinOptions) {
                    if (mixinOptions.hasOwnProperty(optionName) && !config.options.hasOwnProperty(optionName)) {
                        config.options[optionName] = _.assign({}, mixinOptions[optionName]);
                    }
                }
                
                var mixinCls = mixin;
                do {
                    _.forOwn(mixinCls.config.properties, function(property, propName) {
                        var prop = config.properties[propName];
                        if (prop && prop.inherit) {
                            config.properties[propName] = _.assign({}, property, prop);
                        }
                        else if (!prop) {
                            config.properties[propName] = property;
                        }
                    });
                } while ((mixinCls = mixinCls.baseclass) && mixinCls.config);
            });
            _.assign(Cls.prototype, mixMembers);
        }
        
        //properties
        if (config.createProperty) {
            Cls.createProperty = config.createProperty;
        }
        else if (baseCls && baseCls.createProperty) {
            Cls.createProperty = baseCls.createProperty;
        }
        this.__createProperties(Cls);
        
        //options
        croc.Class.__inheritOptions(Cls, config, baseCls);
        
        if (!compatibilityMode) {
            //destruct
            if (!Cls.prototype.hasOwnProperty('dispose')) {
                Cls.prototype.dispose = function() {
                    if (config.destruct) {
                        config.destruct.call(this);
                    }
                    if (Cls.superclass && Cls.superclass.dispose) {
                        Cls.superclass.dispose.call(this);
                    }
                };
            }
            
            if (name) {
                this.__saveClass(name, Cls);
            }
        }
        
        this.__callOnClassCreate(Cls);
        
        return Cls;
    },
    
    /**
     * Returns the class by class name
     * @param {string} name
     * @returns {Function}
     */
    getClass: function(name) {
        return (croc.Class && croc.Class.classes[name]) ||
            (croc.Interface && croc.Interface.interfaces[name]) ||
            croc.utils.objAccess(name);
    },
    
    inherit: function(Cls, baseCls) {
        Cls.prototype = Object.create(baseCls.prototype);
        Cls.prototype.constructor = Cls;
        Cls.superclass = baseCls.prototype;
    },
    
    isSubClass: function(cls, parentCls) {
        return croc.utils.forChain(cls.baseclass, 'baseclass', function(curCls) {
                if (curCls === parentCls) {
                    return true;
                }
            }) || false;
    },
    
    /**
     * @param prop
     * @param Cls
     * @protected
     */
    _inheritProperty: function(prop, Cls) {
        var baseProp;
        var baseCls = Cls;
        while (!baseProp && (baseCls = baseCls.baseclass)) {
            baseProp = baseCls.config && baseCls.config.properties[prop.name];
        }
        
        if (baseProp) {
            _.defaults(prop, baseProp);
        }
    },
    
    /**
     * @param name
     * @param config
     * @param [Cls=null]
     * @private
     */
    __callPreClassCreate: function(name, config, Cls) {
        var baseCls = Cls ? Cls.baseclass : config.extend;
        
        if (baseCls) {
            this.__callPreClassCreate(name, config, baseCls);
        }
        
        var preClassCreate = Cls ? Cls.config && Cls.config.preClassCreate : config.preClassCreate;
        if (preClassCreate) {
            preClassCreate(name, config, baseCls);
        }
    },
    
    /**
     * @param Cls
     * @param [targetCls=null]
     * @private
     */
    __callOnClassCreate: function(Cls, targetCls) {
        var config = Cls.config;
        if (Cls.baseclass) {
            this.__callOnClassCreate(Cls.baseclass, targetCls || Cls);
        }
        if (config && config.onClassCreate) {
            config.onClassCreate(targetCls || Cls);
        }
    },
    
    /**
     * @param {string} name
     * @param {Object} config
     * @private
     */
    __createNativeClass: function(name, config) {
        var Cls = config.construct || function() {};
        this.inherit(Cls, config.extend);
        if (config.members) {
            Cls.prototype = config.members;
        }
        this.__saveClass(name, Cls);
        return Cls;
    },
    
    /**
     * @param Cls
     * @private
     */
    __createProperties: function(Cls) {
        var properties = Cls.config.properties;
        var createPropContent = Cls.createProperty ? Cls : this;
        for (var propName in properties) {
            properties[propName] = createPropContent.createProperty(propName, properties[propName], Cls.prototype, Cls);
        }
    },
    
    /**
     * @param getter
     * @param {Object} prop
     * @returns {*}
     * @private
     */
    __createPropertyGetter: function(getter, prop) {
        if (typeof getter === 'function') {
            return getter;
        }
        if (typeof getter === 'string') {
            return function() {
                return this[getter]();
            };
        }
        
        var key = prop.field || '$$prop-' + prop.name;
        return function() {
            return this[key];
        };
    },
    
    /**
     * @param setter
     * @param prop
     * @param Cls
     * @returns {*}
     * @private
     */
    __createPropertySetter: function(setter, prop, Cls) {
        if (typeof setter === 'function') {
            return setter;
        }
        if (typeof setter === 'string') {
            return function() {
                return this[setter].apply(this, arguments);
            };
        }
        
        var key = prop.field || '$$prop-' + prop.name;
        return function(value, internal) {
            var oldValue = this[key];
            if (prop.transform) {
                value = (typeof prop.transform === 'string' ? this[prop.transform] : prop.transform)
                    .call(this, value, oldValue, internal);
                oldValue = this[key];
            }
            if (prop.type || prop.check) {
                croc.Class.checkType(prop, value, true, Cls && Cls.classname, prop.name);
            }
            if (prop.compare ? !prop.compare.call(this, value, oldValue) : value !== oldValue) {
                this[key] = value;
                
                if (this.$$preConstructed) {
                    if (prop.apply) {
                        (typeof prop.apply === 'string' ? this[prop.apply] : prop.apply)
                            .call(this, value, oldValue, internal);
                    }
                    if (prop.event) {
                        this.fireEvent(prop.event, value, oldValue);
                    }
                }
                return true;
            }
            return false;
        };
    },
    
    /**
     * @param Cls
     * @param config
     * @param baseCls
     * @private
     */
    __inheritOptions: function(Cls, config, baseCls) {
        var options = baseCls.config && baseCls.config.options ?
            _.assign({}, baseCls.config.options) : {};
        var confOptions = config.options;
        var optionsToProperty = {};
        
        if (Cls.compatibilityMode) {
            _.forOwn(options, function(value, optionName) {
                if (config.members.hasOwnProperty(optionName)) {
                    confOptions[optionName] = {value: config.members[optionName]};
                }
            });
        }
        
        if (confOptions) {
            for (var optionName in confOptions) {
                if (confOptions.hasOwnProperty(optionName)) {
                    var confOption = confOptions[optionName];
                    var baseOption = options.hasOwnProperty(optionName) && options[optionName];
                    if (!_.isPlainObject(confOption)) {
                        confOption = confOptions[optionName] = {value: confOption};
                    }
                    var option = _.assign({}, baseOption || {}, confOption);
                    if (baseOption && option.value && baseOption.value && option.value !== baseOption.value) {
                        if (baseOption.extend) {
                            option.value = _.assign({}, baseOption.value, option.value);
                        }
                        else if (baseOption.deepExtend) {
                            option.value = _.merge({}, baseOption.value, option.value);
                        }
                        else if (baseOption.concat) {
                            option.value = baseOption.value.concat(option.value);
                        }
                    }
                    
                    if (!option.name) {
                        option.name = optionName;
                    }
                    if (option.property) {
                        optionsToProperty[optionName] = option;
                    }
                    
                    options[optionName] = option;
                }
            }
        }
        
        config.options = options;
        
        if (Object.keys(optionsToProperty).length) {
            Cls.prototype.$$optionsToProperty = baseCls && baseCls.prototype.$$optionsToProperty ?
                _.assign({}, baseCls.prototype.$$optionsToProperty, optionsToProperty) :
                optionsToProperty;
        }
    },
    
    /**
     * @param config
     * @param passedOptions
     * @private
     */
    __postConstructor: function(config, passedOptions) {
        if (config.mixins) {
            config.mixins.forEach(function(mixin) {
                if (mixin.prototype.__construct__) {
                    mixin.prototype.__construct__.call(this, passedOptions);
                }
            }, this);
        }
    },
    
    /**
     * @param config
     * @param passedOptions
     * @returns {Object}
     * @private
     */
    __preConstructor: function(config, passedOptions) {
        var curOptions;
        if (this.$$compatibilityMode) {
            _.assign(this, passedOptions);
            curOptions = passedOptions = this;
        }
        else {
            curOptions = this.$$optionsSource || {};
        }
        
        //mixins
        if (config.mixins) {
            var callPreConstruct = function(mixin) {
                if (mixin.baseclass && mixin.baseclass.config) {
                    callPreConstruct(mixin.baseclass);
                }
                if (mixin.config.preConstruct) {
                    mixin.config.preConstruct.call(this, passedOptions);
                }
            }.bind(this);
            config.mixins.forEach(callPreConstruct);
        }
        
        //process options
        var options = config.options;
        var passedOptionsHash = _.clone(passedOptions);
        
        var checkOptions = this.$$checkOptions === undefined || this.$$checkOptions;
        var checkRequiredOptions = checkOptions &&
            (this.$$checkRequiredOptions === undefined || this.$$checkRequiredOptions);
        
        if (!checkRequiredOptions) {
            this.$$missedRequiredOptions = {};
        }
        
        for (var optionName in options) {
            if (options.hasOwnProperty(optionName)) {
                var option = options[optionName];
                if (option.hide) {
                    continue;
                }
                delete passedOptionsHash[optionName];
                
                if ((option.type || option.check) && passedOptions[optionName] !== undefined) {
                    croc.Class.checkType(option, passedOptions[optionName], true, this.constructor.classname,
                        option.name);
                }
                
                if (passedOptions.hasOwnProperty(optionName) && passedOptions[optionName] !== undefined) {
                    if ('value' in option) {
                        if (option.extend) {
                            curOptions[optionName] = _.assign({}, option.value, passedOptions[optionName]);
                        }
                        else if (option.deepExtend) {
                            curOptions[optionName] = _.merge({}, option.value, passedOptions[optionName]);
                        }
                        else if (option.concat) {
                            curOptions[optionName] = option.value.concat(passedOptions[optionName]);
                        }
                        else {
                            curOptions[optionName] = passedOptions[optionName];
                        }
                    }
                    else {
                        curOptions[optionName] = passedOptions[optionName];
                    }
                }
                else if ('value' in option) {
                    curOptions[optionName] = Array.isArray(option.value) ? option.value.concat() :
                        _.isPlainObject(option.value) ? _.assign({}, option.value) : option.value;
                }
                else if (option.required && !this.$$compatibilityMode) {
                    if (checkRequiredOptions) {
                        throw new Error('Опция "' + optionName + '" необходима для создания экземпляра класса "' + this.constructor.classname + '"');
                    }
                    else {
                        this.$$missedRequiredOptions[optionName] = true;
                    }
                }
                
                if (option.property) {
                    var property = typeof option.property === 'string' ? option.property : optionName;
                    if (!this.$$propertiesToOptions) {
                        this.$$propertiesToOptions = {};
                    }
                    this.$$propertiesToOptions[property.replace(/^__?/, '')] = option;
                    if (curOptions[optionName] !== undefined) {
                        this.setProperty(property, curOptions[optionName]);
                    }
                }
            }
        }
        
        if (checkOptions && !this.$$compatibilityMode) {
            for (var hashKey in passedOptionsHash) {
                if (hashKey[0] !== '_') {
                    throw new Error('Лишние опции для конструирования инстанции класса "' +
                    this.constructor.classname + '": ' + Object.keys(passedOptionsHash).join(', '));
                }
            }
        }
        
        //listeners
        if (curOptions.listeners && (!this.$$compatibilityMode || _.isPlainObject(curOptions.listeners))) {
            this.on(curOptions.listeners);
        }
        
        return curOptions;
    },
    
    /**
     * @param name
     * @param Cls
     * @private
     */
    __saveClass: function(name, Cls) {
        croc.utils.objAccess(name, croc.utils.objAccess.setVar, Cls);
        this.classes[name] = Cls;
    }
}, true);