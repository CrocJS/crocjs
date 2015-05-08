croc.ns('croc.ui.form');

/**
 * Класс хранит состояние формы (начальное и текущее). Даёт возможность отслеживать изменение/обновление состояния, а
 * также возвращения к начальному состоянию.
 * @extends {croc.Object}
 * @event changeStateChanged (value: {boolean})
 * @event updateStateChanged (value: {boolean})
 * @event updateState (item: {croc.ui.form.field.IField}, value: *) одно из полей формы было обновлено
 * @event changeState (item: {croc.ui.form.field.IField}, value: *) одно из полей формы было изменено
 */
croc.ui.form.StateManager = croc.extend(croc.Object, {
    
    /**
     * Не хранить в состоянии пустые значения
     * @type {boolean}
     */
    removeEmptyValue: true,
    
    init: function() {
        this.__fieldsValues = {};
        this.__items = [];
        this.__itemsOptions = {};
        this.__stateChanged = false;
        this.__stateUpdated = false;
        this.__values = null;
        this.__stateSaved = false;
        
        this.__disposer = new croc.util.Disposer();
        
        this.on('updateState', function(item, value) {
            var state = item && value !== undefined ? this.getState(item, value) : this.getState();
            var stateUpdated = this.__initialState !== state;
            if (stateUpdated !== this.__stateUpdated) {
                this.__stateUpdated = stateUpdated;
                this.fireEvent('updateStateChanged', stateUpdated);
            }
        }, this);
        
        this.on('changeState', function() {
            this.__values = null;
            var stateChanged = this.__initialState !== this.getState();
            if (stateChanged !== this.__stateChanged) {
                this.__stateChanged = stateChanged;
                this.fireEvent('changeStateChanged', stateChanged);
            }
        }, this);
    },
    
    /**
     * Добавить поле
     * @param {croc.ui.form.field.IField} item
     * @param {Object} [options={}]
     * @param {boolean} [options.dontReset=false]
     */
    addItem: function(item, options) {
        if ($.inArray(item, this.__items) !== -1) {
            return;
        }
        
        this.__items.push(item);
        this.__itemsOptions[croc.utils.objUniqueId(item)] = options || {};
        
        this.__disposer.addListener(item, 'changeValue', function(value) {
            if (this.__stateSaved) {
                this.fireEvent('updateState', item, item.getPlainValue());
                this.fireEvent('changeState', item, item.getPlainValue());
            }
        }, this);
        
        if (croc.Interface.check(item, 'croc.ui.form.field.IUpdatableField')) {
            this.__disposer.addListener(item, 'changeInstantValue', function(value) {
                if (this.__stateSaved) {
                    this.fireEvent('updateState', item, value);
                }
            }, this);
        }
        
        if (this.__stateSaved) {
            this.__values = null;
            this.fireEvent('updateState', item);
            this.fireEvent('changeState', item);
        }
    },
    
    /**
     * @param {croc.ui.form.field.IField} [updatedItem = null]
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
     * @param {Array.<croc.ui.form.field.IField>} [ignoreItems=null] игнорировать значения переданных полей при сравнении состояния
     * @returns {boolean}
     */
    getStateChanged: function(ignoreItems) {
        if (!ignoreItems) {
            return this.__stateChanged;
        }
        
        var values = _.assign({}, this.getValues());
        var initialValues = _.assign({}, this.__initialValues);
        $.each(ignoreItems, function(i, item) {
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
     * @param {croc.ui.form.field.IField} item
     */
    removeItem: function(item) {
        if (!croc.utils.arrRemove(this.__items, item)) {
            return;
        }
        this.__disposer.removeObject(item);
        this.fireEvent('updateState', item);
        this.fireEvent('changeState', item);
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
        var $this = this;
        this.__fieldsValues = {};
        $.each(this.__items, function(i, item) {
            $this.__fieldsValues[croc.utils.objUniqueId(item)] = item.getValue();
        });
        
        this.__initialValues = _.cloneDeep(this.getValues());
        this.__initialState = this.getState();
        this.__stateSaved = true;
        
        this.fireEvent('updateState');
        this.fireEvent('changeState');
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
            if (this.removeEmptyValue && item.isEmpty(value)) {
                delete values[item.getIdentifier()];
            }
            else {
                values[item.getIdentifier()] = value;
            }
        }
    }
});
