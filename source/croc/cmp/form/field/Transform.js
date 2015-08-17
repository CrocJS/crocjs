/**
 * api-ru Функции трансформации значения поля
 * api-en Transformation functions of field value.
 * todo comment me
 * api-ru todo trim... - разбить
 * api-en todo trim... - divide
 */
croc.define('croc.cmp.form.field.Transform', {
    
    /**
     * @param value
     * @param old
     * @param chars
     * @returns {string}
     */
    allowedChars: function(value, old, chars) {
        return value && typeof value === 'string' ? value.replace(new RegExp('[^' + chars + ']', 'g'), '') : value;
    },
    
    /**
     * @param transform
     * @returns {Function}
     * @protected
     */
    createTransformFunction: function(transform) {
        if (!transform || typeof transform === 'function') {
            return transform;
        }
        
        if (!Array.isArray(transform)) {
            transform = [transform];
        }
        
        transform = transform.map(function(item) {
            var method = typeof item === 'object' ? item.method : item;
            if (typeof method === 'string') {
                method = croc.cmp.form.field.Transform[method];
            }
            var params = (typeof item === 'object' && item.params) || [];
            
            return {method: method, params: params};
        });
        
        return function(value, old) {
            transform.forEach(function(item) {
                value = item.method.apply(window, [value, old].concat(item.params));
            });
            return value;
        };
    },
    
    digitsOnly: function(value, old) {
        return value && typeof value === 'string' ? value.replace(/[^\d]/g, '') : value;
    },
    
    /**
     * api-ru число с палвающей точкой
     * api-en Number with floating point.
     * @param value
     * @param old
     * api-ru @param {boolean} [spaces=false] разрешить пробелы
     * api-en @param {boolean} [spaces=false] trim spaces.
     * @returns {*}
     */
    'float': function(value, old, spaces) {
        if (value && typeof value === 'string') {
            value = value.replace(/,/g, '.').replace(spaces ? /[^\-\d\. ]/g : /[^\-\d\.]/g, '');
            
            var negative = value[0] === '-';
            value = value.replace(/\-/g, '');
            if (negative) {
                value = '-' + value;
            }
            
            var chunks = value.split('.');
            if (chunks.length > 1) {
                chunks[0] = (chunks[0] || '0') + '.';
            }
            return chunks.join('');
        }
        else {
            return value;
        }
    },
    
    leadZero: function(value, old) {
        var str = value.toString();
        return !value || !/^\d$/.test(str) ? value : '0' + str;
    },
    
    trimLeftAndMultiSpaces: function(value, old) {
        return value && typeof value === 'string' ? value.replace(/^ +/g, '').replace(/ +/g, ' ') : value;
    },
    
    trimSpaces: function(value, old) {
        return value && typeof value === 'string' ? value.replace(/^ +| +$/g, '').replace(/ +/g, ' ') : value;
    },
    
    prohibit: function(value, old) {
        return old;
    },
    
    /**
     * @return {string}
     */
    uppercase: function(value, old) {
        return value && typeof value === 'string' ? value.toUpperCase() : value;
    }
});