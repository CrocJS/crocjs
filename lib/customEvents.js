var derbyTemplates = require('derby/node_modules/derby-templates');

function fireEvent(token, context, element, event) {
    var modelData = context.controller.model.data;
    if (event) {
        modelData.$event = event;
    }
    modelData.$element = element;
    var out = token.expression.apply(context);
    delete modelData.$event;
    delete modelData.$element;
    return out;
}

function isInDom(element) {
    while (element = element.parentNode) {
        if (element == document) {
            return true;
        }
    }
    return false;
}

//todo по идее надо привязать к одному приложению
var processElements = [];

var ElementOn = derbyTemplates.templates.ElementOn;
var elementOnProto = ElementOn.prototype;
var oldEmit = elementOnProto.emit;
elementOnProto.emit = function(context, element) {
    //todo переделать on-appear
    if (this.name === 'create' || this.name === 'appear') {
        processElements.push({
            element: element,
            context: context,
            token: this
        });
    }
    else if (this.name === 'init') {
        fireEvent(this, context, element);
    }
    else if (this.name === 'bind') {
        var bindings = this.expression.apply(context);
        (Array.isArray(bindings) ? bindings : [bindings]).forEach(function(binding) {
            var bindingObject = Object.create(binding);
            bindingObject.$element = element;
            var data = context.controller.model.data;
            for (var key in binding) {
                if (binding.hasOwnProperty(key)) {
                    elementOnProto.emit.call(new ElementOn(key, (function(fn) {
                        return function() {
                            fn.call(bindingObject, data.$event);
                        };
                    })(binding[key])), context, element);
                }
            }
        });
    }
    else if (this.name.indexOf('first-') === 0) {
        this.name = this.name.slice('first-'.length);
        var listener = function(event) {
            element.removeEventListener(this.name, listener);
            return fireEvent(this, context, element, event);
        }.bind(this);
        element.addEventListener(this.name, listener, false);
    }
    else {
        oldEmit.apply(this, arguments);
    }
};

derbyTemplates.templates.ComponentOn.prototype.emit = function(context, component) {
    var expression = this.expression;
    component.on(this.name, function componentOnListener() {
        var args = arguments.length && Array.prototype.slice.call(arguments);
        var modelData = context.controller.model.data;
        context.controller.$widget = modelData.$widget = component;
        if (component.getElement) {
            context.controller.$element = modelData.$element = component.getElement();
        }
        modelData.$args = args || [];
        var result = expression.apply(context);
        delete context.controller.$widget;
        delete modelData.$widget;
        delete context.controller.$element;
        delete modelData.$element;
        delete modelData.$args;
        return result;
    });
};

//todo fix slow bug
//if (Stm.env.device === 'desktop') {
//    var input = document.createElement('input');
//    input.style.width = 0;
//    input.style.height = 0;
//    input.style.border = 'none';
//    input.style.position = 'fixed';
//    input.style.left = 0;
//    input.style.top = 0;
//    document.body.appendChild(input);
//}

//убрать на Element.prototype.appendTo??
var contextProto = derbyTemplates.contexts.Context.prototype;
var oldFlush = contextProto.flush;
contextProto.flush = function() {
    oldFlush.apply(this, arguments);
    
    if (processElements.length) {
        var toFire = [];
        processElements = processElements.filter(function(item) {
            if (isInDom(item.element)) {
                toFire.push(fireEvent.bind(global, item.token, item.context, item.element));
                return false;
            }
            return true;
        });
        toFire.forEach(function(x) { x(); });
    }
    
    /**
     * Очень странный баг. И очень странное его решение. Хром начинает дико тормозить после некоторых действий.
     * Спасает его только фокус на любом поле.
     */
    //if (Stm.env.device === 'desktop' &&
    //    (!document.activeElement || document.activeElement.tagName.toLowerCase() !== 'input')) {
    //    var activeEl = document.activeElement;
    //    input.focus();
    //    if (activeEl) {
    //        activeEl.focus();
    //    }
    //    else {
    //        input.blur();
    //    }
    //}
};