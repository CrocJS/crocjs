croc.define('croc.Interface', {
    interfaces: {},
    
    /**
     * Проверяет, что instance реализует интерфейс iface.
     * @param {Object} instance
     * @param {string} iface
     * @returns {boolean}
     */
    check: function(instance, iface) {
        if (typeof instance === 'function') {
            throw new TypeError('instance должен быть инстанцией класса, но не функцией');
        }
        return !!(instance && instance['$$iface-' + iface]);
    },
    
    define: function(name, config) {
        if (config.extend && !Array.isArray(config.extend)) {
            config.extend = [config.extend];
        }
        
        var iface = {
            $$iface: true,
            name: name,
            config: config,
            ifacesMix: {}
        };
        
        iface.ifacesMix['$$iface-' + name] = true;
        if (config.extend) {
            config.extend.forEach(function(baseIFace) {
                _.assign(iface.ifacesMix, baseIFace.ifacesMix);
            });
        }
        
        croc.utils.objAccess(name, croc.utils.objAccess.setVar, iface);
        croc.Interface.interfaces[name] = iface;
        return iface;
    }
}, true);