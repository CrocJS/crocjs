/**
 * Класс хранит состояние формы (начальное и текущее). Даёт возможность отслеживать изменение/обновление состояния, а
 * также возвращения к начальному состоянию.
 */
croc.Class.define('croc.cmp.form.StateManager', {
    extend: croc.Object,
    
    events: {
        /**
         * @param {croc.cmp.form.field.IField} item
         * @param value
         */
        changeState: null,
        
        /**
         * @param {boolean} value
         */
        changeStateChanged: null,
        
        /**
         * @param {croc.cmp.form.field.IField} item
         * @param value
         */
        updateState: null,
        
        /**
         * @param {boolean} value
         */
        updateStateChanged: null
    },
    
    properties: {
        instantValues: {
            __setter: null,
            event: true
        }
    },
    
    options: {
        /**
         * Не хранить в состоянии пустые значения
         * @type {boolean}
         */
        removeEmptyValue: true
    },
    
    construct: function() {
        croc.cmp.form.StateManager.superclass.construct.apply(this, arguments);
        
        this.__fieldsValues = {};
        this.__items = [];
        this.__itemsOptions = {};
        this.__stateChanged = false;
        this.__stateUpdated = false;
        this.__values = null;
        this.__stateSaved = false;
        this.__setInstantValues({});
        
        this.on('updateState', function(item, value, values) {
            var state = item && value !== undefined ? this.getState(item, value) : this.getState();
            var stateUpdated = this.__initialState !== state;
            if (stateUpdated !== this.__stateUpdated) {
                this.__stateUpdated = stateUpdated;
                this.fireEvent('updateStateChanged', stateUpdated);
            }
            this.__setInstantValues(_.clone(values));
        }, this);
        
        this.on('changeState', function() {
            var stateChanged = this.__initialState !== this.getState();
            if (stateChanged !== this.__stateChanged) {
                this.__stateChanged = stateChanged;
                this.fireEvent('changeStateChanged', stateChanged);
            }
        }, this);
    },
    
    members: {
        /**
         * Добавить поле
         * @param {croc.cmp.form.field.IField} item
         * @param {Object} [options={}]
         * @param {boolean} [options.dontReset=false]
         */
        addItem: function(item, options) {
            if (_.contains(this.__items, item)) {
                return;
            }
            
            this.__items.push(item);
            this.__itemsOptions[croc.utils.objUniqueId(item)] = options || {};
            
            this._getDisposer().addListener(item, 'changeValue', function() {
                if (this.__stateSaved) {
                    this.__values = null;
                    var values = this.getValues();
                    var value = item.getPlainValue();
                    this.fireEvent('updateState', item, value, values);
                    this.fireEvent('changeState', item, value, values);
                }
            }, this);
            
            if (croc.Interface.check(item, 'croc.cmp.form.field.IUpdatableField')) {
                this._getDisposer().addListener(item, 'changeInstantValue', function(value) {
                    if (this.__stateSaved) {
                        this.__mixValue(this.__values, item, value);
                        this.fireEvent('updateState', item, value, this.__values);
                    }
                }, this);
            }
            
            if (this.__stateSaved) {
                this.__values = null;
                var values = this.getValues();
                this.fireEvent('updateState', item, undefined, values);
                this.fireEvent('changeState', item, undefined, values);
            }
        },
        
        /**
         * @param {croc.cmp.form.field.IField} [updatedItem = null]
         * @param [updatedValue = null]
         * @returns {string}
         */
        getState: function(updatedItem, updatedValue) {
            var values = this.getValues();
            if (updatedItem) {
                values = _.assign({}, values);
                this.__mixValue(values, updatedItem, updatedValue);
            }
            return croc.utils.objToKey(values);
        },
        
        /**
         * @param {Array.<croc.cmp.form.field.IField>} [ignoreItems=null] игнорировать значения переданных полей при сравнении состояния
         * @returns {boolean}
         */
        getStateChanged: function(ignoreItems) {
            if (!ignoreItems) {
                return this.__stateChanged;
            }
            
            var values = _.assign({}, this.getValues());
            var initialValues = _.assign({}, this.__initialValues);
            ignoreItems.forEach(function(item) {
                var exported = item.exportValues();
                if (exported) {
                    _.forOwn(exported, function(value, key) {
                        delete values[key];
                        delete initialValues[key];
                    });
                }
                else if (item.getIdentifier()) {
                    delete values[item.getIdentifier()];
                    delete initialValues[item.getIdentifier()];
                }
            });
            
            return croc.utils.objToKey(values) !== croc.utils.objToKey(initialValues);
        },
        
        /**
         * @returns {Object}
         */
        getValues: function() {
            if (this.__values) {
                return this.__values;
            }
            
            var values = {};
            this.__items.forEach(function(item) {
                this.__mixValue(values, item, item.getPlainValue());
            }, this);
            
            this.__values = values;
            return values;
        },
        
        /**
         * Удалить поле
         * @param {croc.cmp.form.field.IField} item
         */
        removeItem: function(item) {
            if (!croc.utils.arrRemove(this.__items, item)) {
                return;
            }
            this._getDisposer().removeObject(item);
            var values = this.getValues();
            this.fireEvent('updateState', item, undefined, values);
            this.fireEvent('changeState', item, undefined, values);
            delete this.__itemsOptions[croc.utils.objUniqueId(item)];
        },
        
        /**
         * Сбросить значения полей на изначальные
         */
        reset: function() {
            this.__items.forEach(function(item) {
                var id = croc.utils.objUniqueId(item);
                if (!this.__itemsOptions[id].dontReset) {
                    item.setValue(this.__fieldsValues.hasOwnProperty(id.toString()) ? this.__fieldsValues[id] : null);
                }
            }, this);
        },
        
        /**
         * Принять за изначальные значения полей текущие
         */
        saveState: function() {
            this.__fieldsValues = _.zipObject(this.__items.map(function(item) {
                return [croc.utils.objUniqueId(item), item.getValue()];
            }, this));
            
            this.__initialValues = _.cloneDeep(this.getValues());
            this.__initialState = this.getState();
            this.__stateSaved = true;
            
            this.fireEvent('updateState', null, undefined, this.__initialValues);
            this.fireEvent('changeState', null, undefined, this.__initialValues);
        },
        
        /**
         * @param values
         * @param item
         * @param value
         * @private
         */
        __mixValue: function(values, item, value) {
            var exported = item.exportValues();
            if (exported) {
                _.assign(values, exported);
            }
            else if (item.getIdentifier()) {
                if (this._options.removeEmptyValue && item.isEmpty(value)) {
                    delete values[item.getIdentifier()];
                }
                else {
                    values[item.getIdentifier()] = value;
                }
            }
        }
    }
});
