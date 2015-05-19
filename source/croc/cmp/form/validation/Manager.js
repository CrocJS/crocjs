/**
 * Менеджер обеспечивает валидацию группы переданных ему полей
 */
croc.Class.define('croc.cmp.form.validation.Manager', {
    extend: croc.Object,
    
    events: {
        /**
         * @param {boolean} valid
         * @param {Array.<croc.cmp.form.validation.IValidatable>} invalidItems
         */
        validated: null,
        
        /**
         * @param {croc.cmp.form.validation.IValidatable} item
         */
        itemAdded: null,
        
        /**
         * @param {croc.cmp.form.validation.IValidatable} item
         */
        itemRemoved: null,
        
        /**
         * @param {croc.cmp.form.validation.IValidatable} item
         */
        itemValidated: null
    },
    
    construct: function() {
        croc.cmp.form.validation.Manager.superclass.construct.apply(this, arguments);
        
        this.__items = [];
        this.__itemsWeights = {};
        this.__itemsHash = {};
        this.__itemsOptions = {};
        this.__validators = {};
        this.__valid = true;
        
        /**
         * @type {Array.<croc.cmp.form.validation.IValidatable>}
         * @private
         */
        this.__invalidItems = [];
    },
    
    members: {
        /**
         * Добавить поле для валидации
         * @param {croc.cmp.form.validation.IValidatable} item
         * @param {object} [options={}] опции валидации
         * @param {string} [options.identifier=null] идентификатор поля для доступа к нему из функции валидации
         * @param {number} [options.weight=0] чем больший вес имеет поле тем позже по отношению к остальным оно проверяется
         * @param {number} [options.suppressValid=0] не делать поле валидным (setValid(true)) даже если оно прошло валидацию
         */
        addItem: function(item, options) {
            var id = croc.utils.objUniqueId(item);
            if (this.__itemsOptions[id]) {
                return;
            }
            
            if (!options) {
                options = {};
            }
            
            this.__items.push(item);
            this.__itemsOptions[id] = options;
            
            if (options.identifier) {
                this.__itemsHash[options.identifier] = item;
            }
            this.__itemsWeights[id] = options.weight || 0;
            if (item.getValidation()) {
                this.__validators[id] =
                    croc.cmp.form.validation.Functions.createValidationFunction(item.getValidation());
            }
            
            this.fireEvent('itemAdded', item);
            
            if (item.getInvalidMessage()) {
                this.setInvalidItem(item, item.getInvalidMessage());
            }
        },
        
        /**
         * Получить все невалидные поля
         * @returns {Array.<croc.cmp.form.validation.IValidatable>}
         */
        getInvalidItems: function() {
            return this.__invalidItems;
        },
        
        /**
         * Получить все сообщения об ошибках валидации
         * @returns {Array.<string>}
         */
        getInvalidMessages: function() {
            return $.map(this.__invalidItems, function(x) { return x.getInvalidMessage(); });
        },
        
        /**
         * Производит проверку состояния поля валидно или нет
         * @param {croc.cmp.form.validation.IValidatable} item
         * @returns {croc.cmp.form.validation.Error}
         */
        getItemValidationError: function(item) {
            var id = croc.utils.objUniqueId(item);
            try {
                var validator = this.__validators[id];
                if (validator) {
                    validator(item.getPlainValue(), item, this.__itemsHash);
                }
                return null;
            }
            catch (ex) {
                if (!(ex instanceof croc.cmp.form.validation.Error)) {
                    throw ex;
                }
                return ex;
            }
        },
        
        /**
         * Возвращает true только если все поля валидны, либо если проверка ещё не проводилась
         * @returns {boolean}
         */
        getValid: function() {
            return this.__valid;
        },
        
        /**
         * Проводилась ли проверка на валидность
         * @returns {boolean}
         */
        getValidated: function() {
            return !!this.__validated;
        },
        
        /**
         * Управляет ли менеджер переданным элементом
         * @param {croc.cmp.form.validation.IValidatable} item
         * @returns {boolean}
         */
        hasItem: function(item) {
            return !!this.__itemsOptions[croc.utils.objUniqueId(item)];
        },
        
        /**
         * Перестать проверять элемент
         * @param {croc.cmp.form.validation.IValidatable} item
         */
        removeItem: function(item) {
            var id = croc.utils.objUniqueId(item);
            if (!this.__itemsOptions[id]) {
                return;
            }
            
            croc.utils.arrRemove(this.__items, item);
            croc.utils.arrRemove(this.__invalidItems, item);
            delete this.__validators[id];
            delete this.__itemsOptions[id];
            
            var identifier;
            _.forOwn(this.__itemsHash, function(curItem, id) {
                if (curItem === item) {
                    identifier = id;
                }
            });
            
            if (identifier) {
                delete this.__itemsHash[identifier];
            }
            
            this.fireEvent('itemRemoved', item);
        },
        
        /**
         * Сбросить состояние валидации элемента
         * @param {croc.cmp.form.validation.IValidatable} item
         */
        resetValidatedItem: function(item) {
            if (item.getValid() === null) {
                return;
            }
            
            item.setInvalidMessage(null);
            item.setValid(null);
            croc.utils.arrRemove(this.__invalidItems, item);
            this.fireEvent('itemValidated', item);
        },
        
        /**
         * Сбрасывает состояние менеджера ({@link #getValidated} возвращает false, массив невалидных полей отчищается)
         */
        resetValidation: function() {
            this.__items.forEach(function(item) {
                item.setInvalidMessage(null);
                item.setValid(null);
                this.fireEvent('itemValidated', item);
            }, this);
            this.__validated = false;
            this.__invalidItems = [];
            this.__valid = true;
        },
        
        /**
         * Пометить поле как невалидное
         * @param {croc.cmp.form.validation.IValidatable} item
         * @param {string} message
         */
        setInvalidItem: function(item, message) {
            item.setInvalidMessage(message);
            item.setValid(false);
            croc.utils.arrRemove(this.__invalidItems, item);
            this.__invalidItems.push(item);
            this.fireEvent('itemValidated', item);
        },
        
        /**
         * Пометить поле как валидное
         * @param {croc.cmp.form.validation.IValidatable} item
         */
        setValidItem: function(item) {
            item.setInvalidMessage(null);
            item.setValid(true);
            croc.utils.arrRemove(this.__invalidItems, item);
            this.fireEvent('itemValidated', item);
        },
        
        /**
         * Производит валидацию все полей
         * @returns {$.Deferred} (boolean)
         */
        validate: function() {
            var deferred = $.Deferred();
            
            this.__valid = true;
            this.__invalidItems = [];
            
            this.__items = this.__items.sort(function(a, b) {
                return this.__itemsWeights[croc.utils.objUniqueId(a)] - this.__itemsWeights[croc.utils.objUniqueId(b)];
            }, this);
            
            this.__items.forEach(function(item) {
                this.__validateOneItem(item);
            }, this);
            
            this.__validated = true;
            this.fireEvent('validated', this.__valid, this.__invalidItems);
//        setTimeout(function(){
            deferred.resolve(this.__valid);
//        }, 500);
//        }, 1000000);
            return deferred;
        },
        
        /**
         * Производит валидацию отдельного поля
         * @param {croc.cmp.form.validation.IValidatable} item
         * @param {function(croc.cmp.form.validation.Error, croc.cmp.form.validation.IValidatable):boolean} invalidCallback
         * вызывается, если поле становится невалидным после валидации. Если возвращает false (строгая проверка), то состояние
         * поля не меняется
         */
        validateItem: function(item, invalidCallback) {
            croc.utils.arrRemove(this.__invalidItems, item);
            this.__validateOneItem(item, invalidCallback);
        },
        
        /**
         * @param {croc.cmp.form.validation.IValidatable} item
         * @param {function(croc.cmp.form.validation.Error, croc.cmp.form.validation.IValidatable):boolean} [invalidCallback=null]
         * @private
         */
        __validateOneItem: function(item, invalidCallback) {
            var id = croc.utils.objUniqueId(item);
            var error = this.getItemValidationError(item);
            
            if (error === null) {
                item.setInvalidMessage(null);
                item.setValid(item.isEmpty() || this.__itemsOptions[id].suppressValid ? null : true);
                this.fireEvent('itemValidated', item);
            }
            else {
                if (!invalidCallback || invalidCallback(error, item) !== false) {
                    item.setInvalidMessage(item.getValidationMessages()[error.getValidatorId()] || error.message);
                    item.setValid(false);
                    this.fireEvent('itemValidated', item);
                }
                this.__invalidItems.push(item);
                this.__valid = false;
            }
        }
    }
});
