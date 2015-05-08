croc.ns('croc.ui.form.field');

/**
 * Функции трансформации значения поля
 * todo comment me
 * todo trim... - разбить
 */
croc.ui.form.field.transform = {
    
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
                method = croc.ui.form.field.transform[method];
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
     * число с палвающей точкой
     * @param value
     * @param old
     * @param {boolean} [spaces=false] разрешить пробелы
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
};