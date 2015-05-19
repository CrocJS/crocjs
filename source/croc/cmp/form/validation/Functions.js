//noinspection JSHint,JSUnusedGlobalSymbols
/**
 * Функции для валидации полей
 * todo translate messages
 */
croc.define('croc.cmp.form.validation.Functions', {
    
    /**
     * Эти правила проверяются даже если поле пустое
     */
    CHECK_ANYWAY: {
        always: true,
        required: true,
        consistentDate: true,
        requiredIf: true//,
        //requiredSubwayForBigCity: true //todo implement or remove
    },
    
    /**
     * порядок следования функций, в котором следует производить валидацию поля
     */
    ORDER: {
        ownFirst: 0,
        required: 1,
        requiredIf: 1,
        //requiredSubwayForBigCity: 1,
        consistentDate: 2,
        
        integer: 10
    },
    
    /**
     * @private
     */
    __EMAIL_REGEX: /^(?:(?:(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]+(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*"))*@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+|(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")*\<(?:@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+(?:,@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+)*:)?(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]+(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*"))*@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+\>)|(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")*:(?:(?:(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]+(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*"))*@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+|(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")*\<(?:@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+(?:,@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+)*:)?(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]+(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*"))*@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+\>)(?:,\s*(?:(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]+(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*"))*@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+|(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")*\<(?:@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+(?:,@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+)*:)?(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*")(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]+(?:$|(?=[\["()<>@,;:\\".\[\]]))|"(?:[^\"\r\\]|\\.)*"))*@(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\])(?:\.(?:[^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031-][^()<>@,;:\\".\[\]!~*'&=$?\/ \000-\031]*(?:$|(?=[\["()<>@,;:\\".\[\]]))|\[(?:[^\[\]\r\\]|\\.)*\]))+\>))*)?;\s*)$/i,
    
    /**
     * Проверяет, что заполнены все три поля даты либо ни одного (месяц может быть выставлен в "январь")
     * @param {string} dayIdentifier
     * @param {string} monthIdentifier
     * @param {string} yearIdentifier
     * @returns {Function}
     */
    consistentDate: function(dayIdentifier, monthIdentifier, yearIdentifier) {
        var requiredFunc = croc.cmp.form.validation.Functions.required();
        return function(value, item, items) {
            if (!items[dayIdentifier].isEmptyState() || !items[yearIdentifier].isEmptyState() || !items[monthIdentifier].isEmptyState()) {
                requiredFunc.apply(this, arguments);
            }
            else {
                this.skipValidation();
            }
        };
    },
    
    /**
     * На основе переданных правил валидации составляет валидационную функцию. При этом если правила переданы в виде
     * объекта и среди правил нет required, то ни одно правило не проверяется при отсутствии значиня у поля и поле
     * считается валидным. Однако если указано правило always, то все правила проверяются в любом случае.
     * @param {object|function|string} validation см. {@link croc.cmp.form.validation.IValidatable#getValidation}
     * @returns {function(value:*)}
     */
    createValidationFunction: function(validation) {
        if (typeof validation === 'function') {
            return validation;
        }
        
        var self = croc.cmp.form.validation.Functions;
        
        if (typeof validation === 'string') {
            validation = JSON.parse(validation);
        }
        
        var validators = [];
        var checkAnyway = false;
        var filter = validation.filter;
        
        _.forOwn(validation, function(params, rule) {
            if (this.CHECK_ANYWAY[rule]) {
                checkAnyway = true;
            }
            
            if (rule === 'always' || rule === 'own' || rule === 'filter' || rule === 'ownFirst') {
                return;
            }
            
            if (!Array.isArray(params)) {
                params = [params];
            }
            
            validators.push({
                func: self[rule].apply(self, params),
                order: rule in self.ORDER ? self.ORDER[rule] : Number.MAX_VALUE,
                id: rule
            });
        }, this);
        
        validators = validators.sort(function(a, b) { return a.order - b.order; });
        if (validation.ownFirst) {
            validators.unshift({func: validation.ownFirst, id: 'ownFirst'});
        }
        if (validation.own) {
            validators.push({func: validation.own, id: 'own'});
        }
        
        var skipValidation = false;
        var thisObj = {
            skipValidation: function() {
                skipValidation = true;
            }
        };
        
        return function(value, item, items) {
            skipValidation = false;
            if ((!filter || filter.apply(window, arguments)) && (checkAnyway || !item.isEmpty())) {
                for (var i = 0, validator; (validator = validators[i++]);) {
                    
                    try {
                        validator.func.apply(thisObj, arguments);
                    }
                    catch (e) {
                        if (validator.id && e instanceof croc.cmp.form.validation.Error && !e.getValidatorId()) {
                            e.setValidatorId(validator.id);
                        }
                        throw e;
                    }
                    
                    if (skipValidation) {
                        break;
                    }
                }
            }
        };
    },
    
    /**
     * Валидация E-Mail
     * @returns {Function}
     */
    email: function() {
        return function(value, item) {
            if (!croc.cmp.form.validation.Functions.__EMAIL_REGEX.test(value)) {
                throw new croc.cmp.form.validation.Error('Неверно указан адрес электронной почты');
            }
        };
    },
    
    /**
     * Проверяет, то что значение поля совпадает со значением поля с идентификатором identifier
     * @param {string} identifier
     * @returns {Function}
     */
    equals: function(identifier) {
        return function(value, item, items) {
            //noinspection JSHint
            if (value != items[identifier].getValue()) {
                throw new croc.cmp.form.validation.Error('Значения полей не совпадают');
            }
        };
    },
    
    /**
     * Валидация icq
     * @returns {Function}
     */
    icq: function() {
        return function(value) {
            if (!value.toString().match(/^(\d\-?){5,8}\d$/)) {
                throw new croc.cmp.form.validation.Error('Неверно указан номер ICQ');
            }
        };
    },
    
    /**
     * Целое число
     * @returns {Function}
     */
    integer: function() {
        return function(value, item) {
            if (!value.toString().match(/^\d+$/)) {
                throw new croc.cmp.form.validation.Error('Введите целое число');
            }
        };
    },
    
    /**
     * Проверяет, что указанный год входит в последние N лет
     * @param {number} n
     * @returns {Function}
     */
    lastNYears: function(n) {
        return this.range(new Date().getFullYear() - n, new Date().getFullYear());
    },
    
    /**
     * Проверка кода программы лояльности
     * @returns {Function}
     */
    loyaltyProgram: function() {
        var lengthFunc = croc.cmp.form.validation.Functions.length;
        return function(value) {
            switch (value.service) {
                case 'malina':
                    if (value.value.substring(0, 6) !== '639300') {
                        throw new croc.cmp.form.validation.Error('Код введён неверно');
                    }
                    else {
                        lengthFunc(16)(value.value);
                    }
                    break;
                case 'mnogo':
                    lengthFunc(8)(value.value);
                    break;
            }
        };
    },
    
    /**
     * Проверяет, что длинна значения равна count
     * @param {number} count
     * @returns {Function}
     */
    length: function(count) {
        return croc.cmp.form.validation.Functions.lengthRange(count, count);
    },
    
    /**
     * Проверяет, что длинна значения укладывается в промежуток от min до max (если max дано)
     * @param {number} min
     * @param {number} [max=undefined]
     * @returns {Function}
     */
    lengthRange: function(min, max) {
        return function(value, item) {
            value = value.toString();
            if ((min && value.length < min) || (max && value.length > max)) {
                var msg = 'Введите ';
                var main;
                if (min === max) {
                    msg += 'ровно ' + max;
                    main = max;
                }
                else if (min && max) {
                    msg += 'от ' + min + ' до ' + max;
                    main = max;
                }
                else if (min) {
                    msg += 'не меньше ' + min;
                    main = min;
                }
                else {
                    msg += 'не больше ' + max;
                    main = max;
                }
                msg += ' ' + croc.utils.strInflect(main, 'символа', 'символов', 'символов');
                throw new croc.cmp.form.validation.Error(msg);
            }
        };
    },
    
    /**
     * Валидация телефонного номера
     * @param {...string} codes
     * @returns {Function}
     */
    phone: function(codes) {
        codes = typeof codes === 'number' ? _.toArray(arguments) : [];
        return function(value, item) {
            if (!/^[0-9]{11,12}$/.test(value.replace(/[^0-9]/g, ''))) {
                throw new croc.cmp.form.validation.Error('Неверно указан номер');
            }
            if (codes.length) {
                var number = value.replace(/[^\d\(]/g, '').match(/\((\d+)/);
                if (!number || !number[1].match(new RegExp('^(' + codes.join('|') + ')'))) {
                    throw new croc.cmp.form.validation.Error(codes.length === 1 ?
                        'Допускается только код города ' + codes[0] :
                        'Допускаются только следующие коды города: ' + codes.join(', '),
                        'phone');
                }
            }
        };
    },
    
    /**
     * Проверяет, что значение укладывается в промежуток от min до max (если max дано)
     * @param {number} min
     * @param {number} [max=undefined]
     * @returns {Function}
     */
    range: function(min, max) {
        return function(value, item) {
            value = parseFloat(value);
            if ((min && value < min) || (max && value > max)) {
                var msg = 'Значение должно быть ';
                if (min && max) {
                    msg += 'от ' + min + ' до ' + max;
                }
                else if (min) {
                    msg += 'не меньше ' + min;
                }
                else {
                    msg += 'не больше ' + max;
                }
                throw new croc.cmp.form.validation.Error(msg);
            }
        };
    },
    
    /**
     * Проверяет соответствует ли значение регулярному выражению
     * @param {string} expression
     * @param {string} [options=undefined]
     * @returns {Function}
     */
    regexp: function(expression, options) {
        var regExp = new RegExp(expression, options);
        return function(value, item) {
            if (!regExp.test(value)) {
                throw new croc.cmp.form.validation.Error('Неправильный формат');
            }
        };
    },
    
    /**
     * Проверяет, что значение существует
     * @returns {Function}
     */
    required: function() {
        return function(value, item) {
            if (item.isEmpty()) {
                throw new croc.cmp.form.validation.Error('Поле не может быть пустым');
            }
        };
    },
    
    /**
     * Проверяет, что значение существует, только если одно из переданных полей не является пустым
     * @param {...string} identifiers
     * @returns {Function}
     */
    requiredIf: function(identifiers) {
        var requiredFunc = croc.cmp.form.validation.Functions.required();
        var ids = Array.prototype.slice.call(arguments, 0);
        return function(value, item, items) {
            if (item.isEmpty()) {
                for (var i = 0, id; (id = ids[i++]);) {
                    if (!items[id].isEmptyState()) {
                        requiredFunc.apply(this, arguments);
                        return;
                    }
                }
                this.skipValidation();
            }
        };
    },
    
    ///**
    // * Станция метро необходима только в крупном городе (Москва, Санкт-Петербург)
    // * @returns {Function}
    // */
    //requiredSubwayForBigCity: function() {
    //    return function(value, item) {
    //        if (item.isEmpty()) {
    //            if (['1-77-0-0-0', '1-78-0-0-0'].indexOf(item.getCityCode()) !== -1) {
    //                throw new croc.cmp.form.validation.Error('Выберите станцию');
    //            }
    //            this.skipValidation();
    //        }
    //    };
    //},
    
    /**
     * Поверяет, что поле "день" валидно (согласно полям "месяц" и "год")
     * @param {string} [monthIdentifier=null]
     * @param {string} [yearIdentifier=null]
     * @returns {Function}
     */
    validDay: function(monthIdentifier, yearIdentifier) {
        return function(value, item, items) {
            var day = parseInt(value, 10);
            var month = monthIdentifier && parseInt(items[monthIdentifier].getPlainValue(), 10);
            var year = yearIdentifier && parseInt(items[yearIdentifier].getPlainValue(), 10);
            if (!yearIdentifier || isNaN(year)) {
                year = 2012; //високосный
            }
            
            if (isNaN(day) || !monthIdentifier || isNaN(month)) {
                if (isNaN(day) || (day < 1 || day > 31)) {
                    throw new croc.cmp.form.validation.Error('Неправильно задан день');
                }
                return;
            }
            
            var date = new Date(year, month - 1, day);
            if (!(date && (date.getMonth() + 1) === month && date.getDate() === day && date.getFullYear() === year)) {
                throw new croc.cmp.form.validation.Error('Неправильно задан день');
            }
        };
    },
    
    /**
     * Проверяет, что количество слов укладывается в промежуток от min до max (если max дано)
     * @param {number} min
     * @param {number} [max=undefined]
     * @returns {Function}
     */
    wordsRange: function(min, max) {
        return function(value) {
            value = value.toString();
            
            var count = value.split(' ').filter(function(x) { return x.length; }).length;
            
            if ((min && count < min) || (max && count > max)) {
                var msg = 'Введите ';
                if (min && max) {
                    msg += 'от ' + min + ' до ' + max;
                }
                else if (min) {
                    msg += 'не меньше ' + min;
                }
                else {
                    msg += 'не больше ' + max;
                }
                msg += ' слов';
                throw new croc.cmp.form.validation.Error(msg);
            }
        };
    }
});
