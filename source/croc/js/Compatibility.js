//old classes
croc.extend = function(parent, config) {
    var newConfig = {
        extend: parent,
        members: config
    };
    
    var hasConstructor = config.hasOwnProperty('constructor');
    if (hasConstructor) {
        config.$$compatibilityConstructor = true;
    }
    if (hasConstructor || config.init) {
        var init = config.init || config.constructor;
        newConfig.construct = function() {
            if (hasConstructor) {
                init.apply(this, arguments);
            }
            else {
                init.call(this, this);
            }
        };
        delete config.init;
        if (hasConstructor) {
            delete config.constructor;
        }
    }
    
    return croc.Class.define(null, newConfig, true);
};

/**
 * @param {Function} cls
 * @param {...Object} mixins
 */
croc.mix = function(cls, mixins) {
    mixins = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < mixins.length; ++i) {
        var mixin = mixins[i];
        if (!mixin) {
            throw new Error('Отсутствует переданный mixin!');
        }
        
        var prop;
        if (typeof mixin === 'function') {
            for (prop in mixin.prototype) {
                if (!cls.prototype.hasOwnProperty(prop) && prop !== '__construct__' && prop !== 'constructor' &&
                    prop !== 'init') {
                    cls.prototype[prop] = mixin.prototype[prop];
                }
            }
            
            var options = mixin.config.options;
            if (options) {
                for (prop in options) {
                    if (options.hasOwnProperty(prop)) {
                        var option = options[prop];
                        if (!cls.prototype.hasOwnProperty(prop)) {
                            var value = _.isPlainObject(option) ? option.value : option;
                            if (value !== undefined) {
                                cls.prototype[prop] = Array.isArray(value) ? value.concat() :
                                    _.isPlainObject(value) ? _.assign({}, value) : value;
                            }
                        }
                    }
                }
            }
            
            cls.config.mixins.push(mixin);
        }
        else {
            for (prop in mixin) {
                if (mixin.hasOwnProperty(prop) && !cls.prototype.hasOwnProperty(prop) &&
                    prop !== 'constructor' && prop !== 'init') {
                    cls.prototype[prop] = mixin[prop];
                }
            }
            
            if (mixin.hasOwnProperty('constructor')) {
                cls.config.mixins.push({
                    config: {},
                    prototype: {__construct__: mixin.constructor}
                });
            }
        }
    }
};

/**
 * @param {Function} cls
 * @param {...Object} ifaces
 */
croc.implement = function(cls, ifaces) {
    Array.prototype.slice.call(arguments, 1).forEach(function(iface) {
        _.assign(cls.prototype, iface.ifacesMix);
    });
};
