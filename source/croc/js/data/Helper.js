var Model = require('../../../../').Model;

croc.define('croc.data.Helper', {
    /**
     * @param {croc.Object|Model} source
     * @param {String} prop
     * @param {Object|Model} target
     * @param {String} targetProp
     * @param {function(*, *):*} [mapper=null]
     * @param [context=null]
     * @return {Function}
     */
    bind: function(source, prop, target, targetProp, mapper, context) {
        if (source instanceof Model) {
            if (target instanceof Model) {
                throw new Error('Use ref or refList to bind model property to another model property');
            }
            var setter = target[croc.Object.getPropertyPart('set', targetProp)];
            
            var sourceListener = function(value, old) {
                if (value !== old) {
                    setter.call(target, mapper ? mapper.call(context || global, value, old) : value);
                }
            };
            
            source.on('change', prop, sourceListener);
            setter.call(target, source.get(prop));
            return function() {
                source.removeListener('change', sourceListener);
            };
        }
        else if (target instanceof Model) {
            return source.listenProperty(prop, function(value, old) {
                target.set(targetProp, mapper ? mapper.call(context || global, value, old) : value);
            });
        }
        throw new Error('Use croc.Object#bind to bind property to another property');
    }
});