/**
 * Базовый интерфейс
 */
croc.Interface.define('croc.IObject', {
    members: {
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
        bind: function(prop, target, targetProp, mapper, context) {},
        
        clearListeners: function() {},
        
        getProperty: function(property) {},
        
        getUniqueId: function() {},
        
        /**
         * Очистка объекта
         */
        dispose: function() {},
        
        /**
         * @param {string} property
         * @param value
         * @param oldValue
         */
        fireChangeProperty: function(property, value, oldValue) {},
        
        /**
         * @param {string} event
         * @param {...*} args
         * @returns {*}
         */
        fireEvent: function(event, args) {},
        
        /**
         * Есть ли обработчики данного события
         * @param {string} event
         */
        hasListeners: function(event) {},
        
        /**
         * Вызывает callback каждый раз, когда значение свойства prop изменяется, а также непосредственно в момент вызова этого
         * метода. Возвращает функцию, которая прекращает прослушивание свойства при её вызове.
         * @param {String} prop
         * @param {Function} callback
         * @param [context=null]
         * @return {Function}
         */
        listenProperty: function(prop, callback, context) {},
        
        /**
         * @param {string|Object.<string, Function>} eventName
         * @param {Function|Object} [fn=null]
         * @param {Object} [context=null]
         */
        on: function(eventName, fn, context) {},
        
        /**
         * @param property
         * @param callback
         * @param [context]
         */
        onChangeProperty: function(property, callback, context) {},
        
        /**
         * Добавить обработчик события, который будет удалён при первом вызове
         * @param {string} event
         * @param {Function} fn
         * @param [scope=null]
         */
        once: function(event, fn, scope) {},
        
        setProperty: function(property, value) {},
        
        /**
         * @param eventName
         * @param fn
         * @param [scope]
         */
        un: function(eventName, fn, scope) {}
    }
});
