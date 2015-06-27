//+ignore croc.ui.Widget

croc.define('croc.utils', {
    /**
     * If obj is array returns it, otherwise returns [obj]
     * @param obj
     * @returns {Array}
     */
    arr: function(obj) {
        return Array.isArray(obj) ? obj : [obj];
    },
    
    /**
     * Ищет элемент в упорядоченном по возрастанию массиве бинарным методом
     * @param {Array} arr
     * @param {function(*):number} test возвращает:
     * -1 - аргумент меньше искомого элемента,
     * 0 - аргумент является искомым аргументом,
     * 1 - аргумент больше искомого элемента
     * @param {Object} [options]
     * @param {number} [options.firstIndex]
     * @param {number} [options.lastIndex]
     * @param {boolean} [options.returnLeftIndex] если точный индекс не был найден - возвращает наиболее близкий слева
     * @param {boolean} [options.returnRightIndex] если точный индекс не был найден - возвращает наиболее близкий справа
     * к искомому
     * @returns {number}
     */
    arrBinarySearch: function(arr, test, options) {
        if (!options) {
            options = {};
        }
        var firstIndex = options.firstIndex || 0;
        var lastIndex = typeof options.lastIndex === 'number' ? options.lastIndex : arr.length - 1;
        while (firstIndex <= lastIndex) {
            if (firstIndex === lastIndex && (options.returnLeftIndex || options.returnRightIndex)) {
                return firstIndex;
            }
            var index = Math.floor((firstIndex + lastIndex) / 2);
            var testRes = test(arr[index], index);
            if (testRes < 0) {
                if (options.returnLeftIndex) {
                    firstIndex = index;
                    if (lastIndex === firstIndex + 1) {
                        if (test(arr[lastIndex], lastIndex) <= 0) {
                            return lastIndex;
                        }
                        else {
                            return firstIndex;
                        }
                    }
                }
                else {
                    firstIndex = index + 1;
                }
            }
            else if (testRes > 0) {
                lastIndex = options.returnRightIndex ? index : index - 1;
            }
            else {
                return index;
            }
        }
        return -1;
    },
    
    /**
     * Поверхностное сравнение массивов
     * @param {Array} array1
     * @param {Array} array2
     * @returns {boolean}
     */
    arrEqual: function(array1, array2) {
        return _.isEqual(array1, array2, function(a, b) {
            if (a !== array1 || b !== array2) {
                return a === b;
            }
        });
    },

//    /**
//     * Вставить элемент в массив до переданного
//     * @param {Array} arr
//     * @param element
//     * @param [before=undefined]
//     */
//    arrInsertBefore: function(arr, element, before) {
//        var index = before === undefined ? -1 : $.inArray(before, arr);
//        if (index === -1) {
//            arr.push(element);
//        }
//        else {
//            arr.splice(index, 0, element);
//        }
//    },
    
    /**
     * @param arr
     * @param element
     * @returns {boolean}
     */
    arrRemove: function(arr, element) {
        var index = arr.indexOf(element);
        if (index !== -1) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    },

//    /**
//     * Превращает функцию принимающую коллбэк в функцию возвращающую deferred
//     * @param func
//     * @param context
//     * @returns {Function}
//     */
//    deferrize: function(func, context) {
//        return function() {
//            var deferred = $.Deferred();
//            func.apply(context || this, _.toArray(arguments).concat(function() {
//                deferred.resolve.apply(deferred, arguments);
//            }));
//            return deferred;
//        };
//    },
    
    /**
     * присоединяет один deferred к другому, так что состояние одного будет передаваться другому
     * @param {$.Deferred} source
     * @param {$.Deferred} dest
     */
    defConnect: function(source, dest) {
        source.then(function() { dest.resolve.apply(dest, arguments); },
            function() { dest.reject.apply(dest, arguments); },
            function() { dest.notify.apply(dest, arguments); });
    },
    
    /**
     * @returns {$.Deferred}
     */
    defRejectCallback: function(param) {
        return $.Deferred().reject(param);
    },
    
    /**
     * Возвращает результат выполнения неасинхронного deferred. Если он асинхронный, то возбуждается исключение.
     * @param {$.Deferred|*} deferred
     * @return {*}
     */
    defSync: function(deferred) {
        var done = false;
        var result;
        $.when(deferred).done(function(res) {
            done = true;
            result = res;
        });
        if (!done) {
            throw new Error('Передан асинхронный deferred!');
        }
        return result;
    },
    
    /**
     * @param {number} timeout
     * @param {croc.util.Disposer} disposer
     * @returns {$.Deferred}
     */
    defTimeout: function(timeout, disposer) {
        var deferred = $.Deferred();
        (disposer ? disposer.setTimeout : this.__setTimeout)
            .call(disposer || this, deferred.resolve.bind(deferred, arguments), timeout);
        return deferred;
    },
    
    /**
     * Возвращает высоту или ширину скрытого элемента
     * @param {jQuery} el
     * @param {string} dim width|height
     * @param {boolean} [outer=false]
     * @param {boolean} [withMargin=false]
     * @returns {*}
     */
    domCalculateHiddenDim: function(el, dim, outer, withMargin) {
        el.css({position: 'absolute', visibility: 'hidden'});
        var result;
        if (dim === 'height') {
            result = outer ? el.outerHeight(!!withMargin) : el.height();
        }
        else {
            result = outer ? el.outerWidth(!!withMargin) : el.width();
        }
        el.css({position: '', visibility: ''});
        return result;
    },
    
    /**
     * Возвращает значение модификатора либо полный модификатор по js-значению
     * @param value
     * @param {string} [prop]
     * @returns {string}
     */
    domGetCssModifier: function(value, prop) {
        if (prop && prop.indexOf('_') !== -1) {
            return value ? prop : null;
        }
        
        var result = value === true ? 'on' : value === false ? 'off' :
        value && value.replace(/[A-Z]/g, function($0) { return '-' + $0.toLowerCase(); });
        return prop ? prop + '_' + result : result;
    },
    
    /**
     * Получить значение модификатора по его имени
     * @param {jQuery} el
     * @param {string} propName
     * @param {boolean} [fullModifier=false]
     * @returns {string|boolean}
     */
    domGetModifier: function(el, propName, fullModifier) {
        if (propName.indexOf('_') !== -1) {
            return fullModifier ? propName : el.hasClass(propName);
        }
        
        var className = el[0] && el[0].className;
        if (!className) {
            return null;
        }
        var match = className.match(new RegExp('\\b' + propName + '_([\\w\\d\\-]+)'));
        if (match) {
            if (fullModifier) {
                return match[0];
            }
            var result = match[1].replace(/-(\w)/g, function($0, $1) { return $1.toUpperCase(); });
            return result === 'on' ? true : result === 'off' ? false : result;
        }
        return null;
    },
    
    /**
     * Получить openerEl по плавающему элементу
     * @param {jQuery} testEl
     * @param {jQuery} [scope=null]
     * @returns {jQuery}
     */
    domGetOpenerOf: function(testEl, scope) {
        var testOpenerId = testEl.closest('[data-opener-element-id]').attr('data-opener-element-id');
        if (!testOpenerId) {
            return null;
        }
        
        var selector = '[data-element-id="' + testOpenerId + '"]';
        var opener = scope ? (scope.is(selector) ? scope : scope.find(selector + ':eq(0)')) : $(selector + ':eq(0)');
        return opener.length ? opener : null;
    },
    
    /**
     * Плагины элемента
     * @param {jQuery} el
     * @return {Array}
     */
    domGetPlugins: function(el) {
        return el.data('$$plugins') || [];
    },
    
    /**
     * Возвращает индекс начала и конца выделенного текста внутри элемента
     * @param {jQuery} el
     * @returns {{start: number, end: number, length: number}}
     */
    domGetTextSelection: function(el) {
        el = el[0];
        var start = 0, end = 0, normalizedValue, range, textInputRange, len, endRange;
        
        if (typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
            start = el.selectionStart;
            end = el.selectionEnd;
        }
        else {
            range = document.selection.createRange();
            
            if (range && range.parentElement() === el) {
                len = el.value.length;
                normalizedValue = el.value.replace(/\r\n/g, "\n");
                
                textInputRange = el.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = el.createTextRange();
                endRange.collapse(false);
                
                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                }
                else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;
                    
                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    }
                    else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }
        }
        
        return {
            start: start,
            end: end,
            length: end - start
        };
    },
    
    /**
     * Скрыть dom-элемент
     * @param {jQuery} el
     * @param {string} [cls='b-hidden']
     */
    domHide: function(el, cls) {
        el.addClass(cls || 'b-hidden');
    },
    
    /**
     * Находится ли элемент в рамках экрана браузера
     * @param {jQuery} el
     * @returns {boolean}
     */
    domIsElementOnScreen: function(el) {
        var w = $(window);
        var wScrollTop = w.scrollTop();
        var elOffsetTop = el.offset().top;
        
        return elOffsetTop > wScrollTop && elOffsetTop < wScrollTop + w.height();
    },
    
    /**
     * Есть ли между плавающим элементом testEl и элементом openerEl или одним из его детей связь opener. Также
     * возвращает true если openerEl является одним из родителей testEl или наоборот.
     * @param {jQuery} openerEl
     * @param {jQuery} testEl
     * @param {boolean} [testIsContainer=false]
     * @returns {boolean}
     */
    domIsElementOpenerOf: function(openerEl, testEl, testIsContainer) {
        if (!testIsContainer) {
            testEl = croc.utils.domGetOpenerOf(testEl);
            if (!testEl) {
                return false;
            }
        }
        do {
            if (openerEl.closest(testEl).length || testEl.closest(openerEl).length) {
                return true;
            }
        } while ((testEl = croc.utils.domGetOpenerOf(testEl)));
        return false;
    },
    
    /**
     * Устанавливает связь opener между целью (target) и плавающим элементом
     * @param {jQuery} el
     * @param {jQuery} openerEl
     */
    domLinkElementToOpener: function(el, openerEl) {
        var openerId = openerEl.attr('data-element-id');
        if (!openerId) {
            openerId = croc.utils.getStmId();
            openerEl.attr('data-element-id', openerId);
        }
        
        el.attr('data-opener-element-id', openerId);
    },
    
    /**
     * Вызывать callback при скроллинге окна и оверлэя - родителя элемента либо его opener'а
     * @param {jQuery} target
     * @param {Function} callback
     * @param [context]
     */
    domListenScrolling: function(target, callback, context) {
        var scrollElements = $(window);
        if (context) {
            callback = callback.bind(context);
        }
        
        if (target) {
            var openerEl = target;
            //noinspection JSHint
            do {
                scrollElements = scrollElements.add(openerEl.parents('.b-scrollable-h,.b-overlay'));
            } while (openerEl = croc.utils.domGetOpenerOf(openerEl));
        }
        
        scrollElements.scroll(callback);
        return scrollElements.off.bind(scrollElements, 'scroll', callback);
    },
    
    /**
     * Возвращает значение css-свойства, преобразуя его к числовому формату
     * @param {jQuery} el
     * @param {string} prop
     * @returns {number}
     */
    domNumericCss: function(el, prop) {
        var result = parseFloat(el.css(prop));
        return isNaN(result) ? 0 : result;
    },
    
    /**
     * Распростронить событие appear на всех дочерних видимых виджетах
     * @param {jQuery} el
     */
    domPropagateAppear: function(el) {
        var toShow = el.find('.js-widget');
        if (el.hasClass('js-widget')) {
            toShow = toShow.add(el);
        }
        toShow.filter(':visible').each(function() {
            croc.ui.Widget.getByElement(this).fireEvent('appear');
        });
    },
    
    /**
     * Установить каретку в нужную позицию элемента
     * @param {jQuery} el
     * @param {number} pos
     */
    domSetCaretPos: function(el, pos) {
        var element = el[0];
        if (element.setSelectionRange) {
            element.setSelectionRange(pos, pos);
        }
        else if (element.createTextRange) {
            var range = element.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    },
    
    /**
     * Изменить значение модификатора по его имени
     * @param {jQuery} el
     * @param {string} propName
     * @param value
     */
    domSetModifier: function(el, propName, value) {
        if (propName.indexOf('_') !== -1) {
            el.toggleClass(propName, !!value);
        }
        else {
            var oldClass = this.domGetModifier(el, propName, true);
            if (oldClass) {
                el.removeClass(oldClass);
            }
            
            if (typeof value === 'boolean') {
                value = value ? 'on' : 'off';
            }
            if (value) {
                el.addClass(propName + '_' + value);
            }
        }
    },
    
    /**
     * Показать dom-элемент
     * @param {jQuery} el
     * @param {boolean} [propagateAppear=false]
     * @param {string} [cls='b-hidden']
     */
    domShow: function(el, propagateAppear, cls) {
        var toShow;
        if (propagateAppear) {
            toShow = el.find('.js-widget');
            if (el.hasClass('js-widget')) {
                toShow = toShow.add(el);
            }
            toShow = toShow.not(':visible');
        }
        el.removeClass(cls || 'b-hidden');
        if (propagateAppear) {
            toShow.each(function() {
                var widget = croc.ui.Widget.getByElement(this);
                if (widget.hasListeners('appear') && widget.isVisible()) {
                    widget.fireEvent('appear');
                }
            });
        }
    },
    
    /**
     * Отслеживание клика по элементу (не срабатывает если место отпускания кнопки мыши отстоит далеко от места
     * нажатия кнопки)
     * @param {jQuery} el
     * @param {function(jQuery.Event)} callback
     * @param [context=null]
     * @returns {function}
     */
    domStableClick: function(el, callback, context) {
        var listener = context ? callback.bind(context) : callback;
        if (Stm.env.device !== 'desktop') {
            var oldListener = listener;
            listener = function(e) {
                e.target = e.pointers[0].target;
                e.currentTarget = el[0];
                oldListener.apply(this, arguments);
            };
            var hammerEl = Hammer(el[0] === document ? document.body : el[0]);
            hammerEl.on('tap', listener);
            return hammerEl.off.bind(hammerEl, 'tap', listener);
        }
        var startX;
        var startY;
        var cancel;
        var listeners = {
            mousedown: function(e) {
                cancel = false;
                startX = e.pageX;
                startY = e.pageY;
            },
            mouseup: function(e) {
                var dX = e.pageX - startX;
                var dY = e.pageY - startY;
                if (e.which === 1 && !cancel && Math.sqrt(dX * dX + dY * dY) < 10) {
                    listener(e);
                }
            },
            mouseleave: function(e) {
                cancel = true;
            }
        };
        
        el.on(listeners);
        return el.off.bind(el, listeners);
    },
    
    /**
     * Изменить видимость dom-элемента
     * @param {jQuery} el
     * @param {boolean} [value]
     * @param {boolean} [propagateAppear=false]
     * @param {string} [cls='b-hidden']
     */
    domToggle: function(el, value, propagateAppear, cls) {
        if (value || value === undefined && el.hasClass(cls || 'b-hidden')) {
            croc.utils.domShow(el, propagateAppear, cls);
        }
        else {
            croc.utils.domHide(el, cls);
        }
    },

//    /**
//     * Конвертировать событие объекта в Deferred
//     * @param source
//     * @param eventType
//     * @returns {$.Deferred}
//     */
//    eventToDeferred: function(source, eventType) {
//        var def = $.Deferred();
//        source.on(eventType, function() {
//            def.resolve.apply(def, arguments);
//        });
//
//        return def;
//    },
    
    /**
     * Возвращает функцию, вызов которой блокирует все дальнейшие вызовы пока не будет вызвана функция free
     * @param {function(Function)} callback
     * @param [context]
     */
    fnMutex: function(callback, context) {
        var enabled = true;
        var locked = false;
        
        function free(lock) {
            if (lock === croc.utils.fnMutex.lock) {
                locked = true;
            }
            enabled = true;
        }
        
        return function() {
            if (enabled && !locked) {
                enabled = false;
                callback.apply(context || this, [free].concat(_.toArray(arguments)));
                return true;
            }
            return false;
        };
    },
    
    /**
     * Работает подобно Function.prototype.bind, но при этом передаёт в новую функцию изначальный контекст первым
     * аргументом.
     * @param {Function} fn
     * @param [context]
     * @returns {Function}
     */
    fnRetentiveBind: function(fn, context) {
        return function() {
            fn.apply(context || this, [this].concat(_.toArray(arguments)));
        };
    },
    
    fnSmartDebounce: function(fn, wait) {
        var timeout;
        return function() {
            if (timeout) {
                clearTimeout(timeout);
            }
            var args = arguments;
            timeout = setTimeout(function() {
                fn.apply(global, args);
            }, wait.apply(global, args));
        }
    },
    
    /**
     * @param obj
     * @param property
     * @param callback
     */
    forChain: function(obj, property, callback) {
        if (obj) {
            do {
                var result = callback(obj);
                if (result !== undefined) {
                    return result;
                }
            } while (obj = obj[property]);
        }
    },
    
    /**
     * @returns {string}
     */
    getStmId: function() {
        return _.uniqueId('stm-');
    },
    
    /**
     * Возвращает z-index для блока находящегося на одном из слоёв: page, fixed, popup
     * @param {string} [layer='popup']
     * @returns {number}
     */
    getZIndex: function(layer) {
        if (!this.__zIndex) {
            this.__zIndex = {
                page: 8000,
                fixed: 6000,
                popup: 10000
            };
        }
        return ++this.__zIndex[layer || 'popup'];
    },
    
    /**
     * @param num
     * @param [decimal=0]
     * @param [separator=' ']
     * @param [forceDecimal=true]
     * @returns {string}
     */
    numFormat: function(num, decimal, separator, forceDecimal) {
        decimal = (typeof(decimal) !== 'undefined') ? decimal : 0;
        separator = (typeof(separator) !== 'undefined') ? separator : ' ';
        var r = parseFloat(num);
        var exp10 = Math.pow(10, decimal);
        r = Math.round(r * exp10) / exp10;
        var rr = Number(r).toFixed(decimal).toString().split('.');
        if (forceDecimal !== undefined && !forceDecimal && decimal > 0) {
            rr[1] = rr[1].replace(/0+$/, '');
        }
        var b = rr[0].replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g, "$1" + separator);
        r = b + (rr[1] ? '.' + rr[1] : '');
        
        return r;
    },
    
    /**
     * Форматирование числа
     * @param {number|string} num
     */
    numMoneyFormat: function(num) {
        if (typeof num === 'string') {
            num = parseFloat(num);
        }
        return croc.utils.numFormat(num, Math.floor(num) === num ? 0 : 2);
    },
    
    /**
     * Если num выходит за пределы отрезка [a, b], то возвращает a или b (в зависимости от того где по отношению к
     * отрезку лежит num) иначе возвращает num
     * @param {number} num
     * @param {number} [a]
     * @param {number} [b]
     * @return {number}
     */
    numToRange: function(num, a, b) {
        var min;
        var max;
        
        if (typeof a === 'number' && typeof b === 'number') {
            min = Math.min(a, b);
            max = Math.max(a, b);
        }
        else if (typeof a === 'number') {
            min = a;
        }
        else if (typeof b === 'number') {
            max = b;
        }
        
        if (min !== undefined) {
            num = Math.max(min, num);
        }
        if (max !== undefined) {
            num = Math.min(max, num);
        }
        
        return num;
    },
    
    /**
     * Доступ к данным внутри объекта по переданному пути
     * @param {Object|string} [obj=window] объект, к которому производится доступ
     * @param {string|number} [path] путь до требуемых данных (например, "foo.bar" для доступа к obj.foo.bar)
     * @param {number|*} [action=croc.utils.objAccess.getVar] тип доступа:
     * croc.utils.objAccess.getVar - получение данных (если данные отсутствуют возвращается undefined)
     * croc.utils.objAccess.setVar - присвоить полю данные data, при этом если какая-то чать пути отсутствует, то она создаётся как пустой объект
     * croc.utils.objAccess.setVarIfNotExists - присвоить полю данные data, если оно отсутствует, при этом если какая-то чать пути отсутствует, то она создаётся как пустой объект
     * croc.utils.objAccess.deleteVar - удалить поле по указанному пути
     * @param {*} [data=null] данные, которые нужно назначить, если action равно getVar или setVar
     * @return {*}
     */
    objAccess: function(obj, path, action, data) {
        if (typeof obj === "string") {
            data = action;
            action = path;
            path = obj;
            obj = global;
        }
        if (action && typeof action !== 'number' && !data) {
            data = action;
            action = croc.utils.objAccess.setVar;
        }
        else {
            if (!action) {
                action = croc.utils.objAccess.getVar;
            }
            if (!data) {
                data = {};
            }
        }
        
        path = path.split(".");
        
        for (var i = 0, length = path.length; i < length; ++i) {
            var chunk = path[i];
            
            if (i === length - 1) {
                var old = obj[chunk];
                switch (action) {
                    case croc.utils.objAccess.getVar:
                        return obj[chunk];
                    case croc.utils.objAccess.setVar:
                        obj[chunk] = data;
                        return old;
                    case croc.utils.objAccess.setVarIfNotExists:
                        if (old === undefined) {
                            obj[chunk] = data;
                        }
                        return obj[chunk];
                    case croc.utils.objAccess.deleteVar:
                        delete obj[chunk];
                        return old;
                }
            }
            else if (obj[chunk] === undefined) {
                if (action === croc.utils.objAccess.setVar || action === croc.utils.objAccess.setVarIfNotExists) {
                    obj[chunk] = {};
                }
                else {
                    return undefined;
                }
            }
            
            obj = obj[chunk];
        }
    },
    
    /**
     * Возвращает глубокую копию объекта без системных данных (ключи начинаются с $$)
     * @param obj
     * @returns {*}
     */
    objCloneWithoutSystemData: function(obj) {
        if (Array.isArray(obj)) {
            return obj.map(function(x) {
                return croc.utils.objCloneWithoutSystemData(x);
            });
        }
        else if (_.isPlainObject(obj)) {
            var objClone = {};
            for (var key in obj) {
                if ((key[0] !== '$' || key[1] !== '$') && obj.hasOwnProperty(key)) {
                    objClone[key] = croc.utils.objCloneWithoutSystemData(obj[key]);
                }
            }
            return objClone;
        }
        else {
            return obj;
        }
    },
    
    /**
     * Являются ли два объекта идентичными. Не учитывает ключи, которые начинаются на $$.
     * @param {Object} obj1
     * @param {Object} obj2
     * @returns {boolean}
     */
    objEqual: function(obj1, obj2) {
        if (!_.isPlainObject(obj1) || !_.isPlainObject(obj2)) {
            return obj1 === obj2;
        }
        
        function filter(x) {
            return x[0] !== '$' || x[1] !== '$';
        }
        
        var keys = Object.keys(obj1).filter(filter);
        if (!_.isEqual(keys, Object.keys(obj2).filter(filter))) {
            return false;
        }
        
        return keys.every(function(key) { return obj1[key] === obj2[key]; });
    },
    
    /**
     * @param obj
     * @param {*|function(*):boolean} target
     * @param iterator
     * @param path
     * @returns {*}
     */
    objFindPath: function(obj, target, iterator, path) {
        if (typeof target === 'function' ? target(obj) : obj === target) {
            if (iterator) {
                iterator(obj, path, true);
            }
            return path;
        }
        if (Array.isArray(obj) || _.isPlainObject(obj)) {
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    var result = this.objFindPath(obj[key], target, iterator, (path ? path + '.' : '') + key);
                    if (result !== null) {
                        if (iterator) {
                            iterator(obj, path || '');
                        }
                        return result;
                    }
                }
            }
        }
        return null;
    },
    
    /**
     * Является ли part подмножеством object
     * @param {Object|Array} object
     * @param {Object|Array} part
     * @returns {boolean}
     */
    objIncludes: function(object, part) {
        return Object.keys(part).every(function(key) {
            var a = object[key];
            var b = part[key];
            return a === b ||
                (a && b && typeof a === 'object' && typeof b === 'object' && croc.utils.objIncludes(a, b));
        });
    },
    
    /**
     * Удаляет хранилище возвращённое методом {@link #getUserData}
     * @param {Object} owner
     * @param {Object|jQuery} [object]
     */
    objRemoveUserData: function(owner, object) {
        if (!object) {
            object = owner;
        }
        
        var sharedStore;
        if (object instanceof jQuery) {
            sharedStore = object.data('$$sharedStore');
            if (!sharedStore) {
                object.data('$$sharedStore', sharedStore = {});
            }
        }
        else {
            sharedStore = object.$$sharedStore || (object.$$sharedStore = {});
        }
        
        var storeKey = '$$owner-' + croc.utils.objUniqueId(owner);
        delete sharedStore[storeKey];
    },
    
    /**
     * Сопоставляет объекту или массиву уникальный строковый ключ
     *
     * @param {Object|Array} object
     * @param {Boolean} [asJSON=true]
     */
    objToKey: function(object, asJSON) {
        var result;
        if (Array.isArray(object)) {
            result = object.map(function(item) {
                return croc.utils.objToKey(item, false);
            });
        }
        else if (_.isPlainObject(object)) {
            result = [];
            _.forOwn(object, function(value, key) {
                if (key[0] === '$' && key[1] === '$') {
                    return;
                }
                result.push([key, croc.utils.objToKey(value, false)]);
            });
            
            result.sort(function(a, b) {return a[0].localeCompare(b[0]);});
            result.unshift("__objectequiv__");
        }
        else {
            result = object;
        }
        
        return asJSON === undefined || asJSON ? JSON.stringify(result) : result;
    },
    
    /**
     * Возвращает объект уникальный для переданного владельца и объекта-хранителя
     * @param {Object} owner
     * @param {Object|jQuery} [object]
     * @returns {Object}
     */
    objUserData: function(owner, object) {
        if (!object) {
            object = owner;
        }
        
        var sharedStore;
        if (object instanceof jQuery) {
            sharedStore = object.data('$$sharedStore');
            if (!sharedStore) {
                object.data('$$sharedStore', sharedStore = {});
            }
        }
        else {
            sharedStore = object.$$sharedStore || (object.$$sharedStore = {});
        }
        
        var storeKey = '$$owner-' + croc.utils.objUniqueId(owner);
        return sharedStore[storeKey] || (sharedStore[storeKey] = {});
    },
    
    /**
     * Получить уникальный идентификатор любого javascript объекта
     * @param {Object|jQuery} object
     * @return {Number}
     */
    objUniqueId: function(object) {
        if (object.$$uniqueId) {
            return object.$$uniqueId;
        }
        
        if (typeof jQuery !== 'undefined' && object instanceof jQuery) {
            var id = object.data('$$uniqueId');
            if (!id) {
                object.data('$$uniqueId', id = _.uniqueId());
            }
            return id;
        }
        return object.$$uniqueId = _.uniqueId();
    },
    
    /**
     * Массив значений объекта. Пропускает поля с ключами, которые начинаются на $$.
     * @param {Object} object
     * @returns {Array}
     */
    objValues: function(object) {
        var values = [];
        _.forOwn(object, function(value, key) {
            if (key[0] !== '$' || key[1] !== '$') {
                values.push(value);
            }
        });
        return values;
    },
    
    /**
     * Сбросить zIndex на первоначальные значения
     */
    resetZIndex: function() {
        this.__zIndex = null;
    },
    
    /**
     * @returns {number}
     */
    scrollbarWidth: function() {
        if (!this.__scrollBarWidth) {
            var div = $('<div style="width:50px;height:50px;overflow:auto;position:absolute;top:-200px;left:-200px;">');
            // Append our div, do our calculation and then remove it 
            $('body').append(div);
            var w1 = div.innerWidth();
            var w2 = div.append('<div style="height:100px;width:100%;">').find('div').innerWidth();
            $(div).remove();
            this.__scrollBarWidth = (w1 - w2);
        }
        return this.__scrollBarWidth;
    },
    
    /**
     * Переводит dasher и underscore строку в camel (one-two или one_two в oneTwo)
     * @param {string} str
     * @returns {string}
     */
    strCamelize: function(str) {
        return str.replace(/(?:_|\-)+(\w)/g, function(match, letter) {
            return letter.toUpperCase();
        });
    },
    
    /**
     * @param {string} str
     * @returns {string}
     */
    strCapitalize: function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    /**
     * Переводит camel и underscore строку в dasher (one-two или one_two в oneTwo)
     * @param {string} str
     * @returns {string}
     */
    strDasherize: function(str) {
        str = str.replace(/_+/g, '-').replace(/[A-ZА-ЯЁ]/g, function(match) {
            return '-' + match.toLowerCase();
        }).replace(/-+/g, '-');
        return str[0] === '-' ? str.substr(1) : str;
    },
    
    /**
     * @param {string} str
     * @returns {string}
     */
    strEscapeHtml: (function() {
        var chr = {
            '"': '&quot;', '&': '&amp;', "'": '&#39;',
            '/': '&#47;', '<': '&lt;', '>': '&gt;'
        };
        return function(text) {
            return text.replace(/["&'\/<>]/g, function(a) { return chr[a]; });
        };
    }()),
    
    /**
     * Экранирует специальные символы регулярных выражений
     * @param {string} str
     * @returns {string}
     */
    strEscapeRegexp: function(str) {
        return (str + '').replace(/([.?*+\^$\[\]\\(){}|\-])/g, "\\$1");
    },
    
    /**
     * @param count
     * @param one
     * @param two
     * @param many
     * @returns {*}
     */
    strInflect: function(count, one, two, many) {
        var tail = count % 100;
        if (tail > 20 || tail < 5) {
            switch (tail % 10) {
                case 1 :
                    many = one;
                    break;
                case 2 :
                case 3 :
                case 4 :
                    many = two;
            }
        }
        return many;
    },
    
    strPluralize: function(str) {
        var lastChar = str[str.length - 1];
        if (lastChar === 'y') {
            return str.slice(0, -1) + 'ies';
        }
        else if (lastChar === 's') {
            return str + 'es';
        }
        else {
            return str + 's';
        }
    },

//    /**
//     * @param str
//     * @returns {string}
//     */
//    stripTags: function(str) {
//        return str.replace(/(<([^>]+)>)/ig, '');
//    },
    
    /**
     * Выделяет вхождения подстроки с <b></b>
     * @param {string} str
     * @param {string} substr
     * @param {string} [wrapper='<b>{content}</b>']
     */
    strHighlightSubstring: function(str, substr, wrapper) {
        if (!substr || !str) {
            return str;
        }
        
        var regexpString = croc.utils.strEscapeRegexp(substr).replace(/[йи]/ig, "[йи]").replace(/[ёе]/ig, "[ёе]");
        var regexp = new RegExp('^([^<>]*?(?:<[^<>]*?>[^<>]*?)*?)(' + regexpString + ')', 'i');
        return str.replace(regexp, function(match, before, substr) {
            return before + (wrapper || '<b>{content}</b>').render({content: substr});
        });
    },
    
    /**
     * @param {string} str
     * @returns {string}
     */
    strNl2br: function(str) {
        return str.replace(/([^>])\n/g, '$1<br/>');
    },
    
    /**
     * Дополняет строку нулями (или любым другим переданным символом) слева до необходимой длинны
     * @param {String|*} str
     * @param {Number} length
     * @param {String} [chr='0']
     * @returns {string}
     */
    strPad: function(str, length, chr) {
        str = str.toString();
        if (!chr) { chr = '0'; }
        while (str.length < length) {
            str = chr + str;
        }
        return str;
    },
    
    /**
     * Возвращает дату в виде строки "Y-m-d"
     * @param {Object<Date>} date
     * @returns {string}
     */
    strYmdDate: function(date) {
        return date.getFullYear() + '-' + this.strPad(date.getMonth() + 1, 2) + '-' + this.strPad(date.getDate(), 2);
    },
    
    /**
     * Изменяет регистр первой буквы слова на верхний
     * @param {string} str
     * @returns {string}
     */
    strUcFirst: function(str) {
        return str && (str[0].toUpperCase() + str.substr(1));
    }

//    toTitleCase: function(str) {
//        return str.replace(/\w\S*/g, function(txt) {
//            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
//        });
//    },
});

_.assign(croc.utils.objAccess, {
    getVar: 1,
    setVar: 2,
    setVarIfNotExists: 3,
    deleteVar: 4
});


/**
 * monkey patching!
 */
if (croc.isClient) {
    document.write = function(html) { // jshint ignore:line
        $('body').append(html);
    };
}

String.prototype.render = function(obj) {
    return this.replace(
        /{([^{}]*)}/g,
        function(a, b) {
            var r = obj[b] || croc.utils.objAccess(obj, b);
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

croc.utils.fnMutex.lock = {};