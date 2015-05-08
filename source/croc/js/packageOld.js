//+ignore croc
//+use bower:jquery

if (typeof global === 'undefined') {
    window.global = window; 
}
global._ = require('lodash');
if (typeof window === 'undefined') {
    global.window = global;
}
if (typeof croc === 'undefined') {
    global.croc = {
        isServer: false,
        isClient: true
    };
}

//Object.create
// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {
    Object.create = function(prototype) {
        var object;
        
        function Type() {}
        
        if (typeof prototype !== 'object' && typeof prototype !== 'function') {
            throw new TypeError('Object prototype may only be an Object or null');
        }
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
        
        return object;
    };
}