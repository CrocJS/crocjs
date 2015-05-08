croc.Class.define('croc.data.Model', {
    extend: croc.Object,
    
    options: {
        model: {},
        property: {},
        data: {}
    },
    
    construct: function(options) {
        croc.data.Model.superclass.__construct__.apply(this, arguments);
        _.assign(this, options.data);
        this._model = options.model.at(options.property);
        this._model.set(this);
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
            var propName = this['$$event-' + eventName];
            if (typeof propName === 'string') {
                callback = context ? callback.bind(context) : callback;
                callback.listener = this._model.on('change', propName, callback);
            }
            else {
                croc.data.Model.superclass.addListener.apply(this, arguments);
            }
            return this;
        },
        
        getRaw: function() {
            return this._model;
        },
        
        onRaw: function() {
            return this._model.on.apply(this._model, arguments);
        }
    },
    
    /**
     * Создать свойство для объекта
     * @param name
     * @param prop
     * @param dest
     * @param [Cls]
     */
    createProperty: function(name, prop, dest, Cls) {
        if (!prop || !prop.model) {
            return croc.Class.createProperty.apply(croc.Class, arguments);
        }
        
        prop.name = name;
        if (prop.inherit) {
            croc.Class._inheritProperty(prop, Cls);
        }
        
        var ucfPropName = croc.utils.strUcFirst(name);
        
        //getter
        prop.getterName = 'get' + ucfPropName;
        dest[prop.getterName] = function() {
            return this[name];
        };
        
        //event
        prop.event = 'change' + ucfPropName;
        dest['$$event-' + prop.event] = name;
        
        //setter
        var setterPrefix = ('__setter' in prop && '__') || ('_setter' in prop && '_') || '';
        prop.setterName = setterPrefix + 'set' + ucfPropName;
        var setter = prop[setterPrefix + 'setter'];
        dest[prop.setterName] = function(value) {
            if (this._options[name] !== value) {
                if (prop.type || prop.check) {
                    croc.Class.checkType(prop, value, true, Cls.classname, prop.name);
                }
                if (setter) {
                    setter.call(this, value, this._model.get(name));
                }
                else {
                    this._model.set(name, value);
                }
            }
        };
        
        return prop;
    }
});