croc.ns('croc.ui.form.validation');

/**
 * Контроллер инкапсулирует стандартное взаимодействие формы с менеджером валидации
 * @extends {croc.Object}
 * @internal
 */
croc.ui.form.validation.Controller = croc.extend(croc.Object, {
    
    /**
     * Ошибки валидации полей, которые следует установить при их полявлении
     * @type {Object.<string, string>}
     */
    fieldsInvalidMessages: null,
    
    /**
     * форма
     * @type {croc.ui.form.Form}
     * @required
     */
    form: null,
    
    notifierConf: null,
    
    /**
     * Опции устанавливающие особенности валидации формы
     * @type {Object}
     */
    validationBehavior: {
        /**
         * Сбросить состояние валидации поля при фокусе
         * @type {boolean}
         */
        resetTextFieldOnFocus: true,
        
        /**
         * Сбросить состояние валидадации всей формы при любом событии (фокус, смена значения)
         * @type {boolean}
         */
        resetStateOnEvent: false,
        
        /**
         * Произвести валидацию поля при потере фокуса
         * @type {boolean}
         */
        revalidateTextFieldOnBlur: true,
        
        /**
         * Произвести валидацию поля при изменении значения
         * @type {boolean}
         */
        revalidateFieldOnChangeValue: true
    },
    
    /**
     * Нужно ли производить валидацию формы
     * @type {boolean}
     */
    validateForm: true,
    
    init: function() {
        this.__offRevalidate = {};
        this.__preventRevalidation = {};
        
        this.validationBehavior = _.assign({}, croc.ui.form.validation.Controller.prototype.validationBehavior,
            this.validationBehavior);
        
        this.__validationManager = new croc.ui.form.validation.Manager();
        this.__validationManager.addItem(this.form, {weight: 100});
        
        //notifier
        if (!this.notifierConf) {
            this.notifierConf = {};
        }
        this.notifierConf.validationManager = this.__validationManager;
        this.__notifier = new croc.ui.form.validation.Notifier(this.notifierConf);
        this.__notifier.setTooltipAutoOpen(false);
        
        this.form.on({
            itemAdded: function(field) {
                if (field.getParentSection() !== 'fields') {
                    return;
                }
                
                var meta = field.getMeta();
                this.__validationManager.addItem(field, {
                    identifier: field.getIdentifier(),
                    suppressValid: meta.suppressValid
                });
                
                this.__setUpFieldValidation(field);
            },
            removeField: function(field) {
                this.__validationManager.removeItem(field);
            }
        }, this);
        
        this.__setUpFormValidationBehavior();
    },
    
    /**
     * @returns {croc.ui.form.validation.Manager}
     */
    getManager: function() {
        return this.__validationManager;
    },
    
    /**
     * @returns {croc.ui.form.validation.Notifier}
     */
    getNotifier: function() {
        return this.__notifier;
    },
    
    /**
     * Отключить повторную валидацию поля при потере фокуса
     * @param {croc.ui.form.field.IField} field
     */
    offFieldRevalidating: function(field) {
        this.__offRevalidate[croc.utils.objUniqueId(field)] = true;
    },
    
    trySubmit: function(successCallback, failCallback, context) {
        if (!context) {
            context = window;
        }
        
        if (this.validateForm && !Stm.env.formDisableValidation) {
            this.validate().done(function(valid) {
                
                if (valid) {
                    successCallback.call(context);
                }
                else {
                    failCallback.call(context);
                }
            });
        }
        else {
            successCallback.call(context);
        }
    },
    
    /**
     * Произвести валидацию полей формы
     * @returns {$.Deferred}
     */
    validate: function() {
        if (this.validateForm && !Stm.env.formDisableValidation) {
            this.__notifier.setTooltipAutoOpen(false);
            return this.__validationManager.validate().always(function() {
                this.__notifier.setTooltipAutoOpen(true);
            }.bind(this));
        }
        else {
            return $.Deferred().resolve(true);
        }
    },
    
    /**
     * @param {croc.ui.form.field.ITextField} field
     * @private
     */
    __resetValidationOnFocus: function(field) {
        var changed = false;
        var updateListener = function() {
            changed = true;
        };
        
        field.on({
            
            focus: function() {
                this.__preventRevalidation[field.getUniqueId()] = true;
                
                if (this.__validationManager.hasItem(field) &&
                    (this.__validationManager.getValidated() || field.getInvalidMessage()) &&
                    (!croc.Interface.check(field, 'croc.ui.form.field.IDisable') || !field.getDisabled())) {
                    
                    if (croc.Interface.check(field, 'croc.ui.form.field.IUpdatableField')) {
                        field.on('changeInstantValue', updateListener);
                    }
                    
                    if (this.validationBehavior.resetStateOnEvent) {
                        this.__validationManager.resetValidation();
                    }
                    else if (this.validationBehavior.resetTextFieldOnFocus) {
                        this.__validationManager.resetValidatedItem(field);
                    }
                }
            }.bind(this),
            
            blur: function() {
                delete this.__preventRevalidation[field.getUniqueId()];
                
                if (this.__validationManager.hasItem(field) &&
                    (!croc.Interface.check(field, 'croc.ui.form.field.IDisable') || !field.getDisabled())) {
                    if (this.validationBehavior.revalidateTextFieldOnBlur) {
                        this.__revalidateField(field, changed);
                    }
                    
                    if (croc.Interface.check(field, 'croc.ui.form.field.IUpdatableField')) {
                        field.un('changeInstantValue', updateListener);
                    }
                    
                    changed = false;
                }
            }.bind(this)
        });
    },
    
    /**
     * @param {croc.ui.form.field.IField} field
     * @param {boolean} changed
     * @private
     */
    __revalidateField: function(field, changed) {
        var fieldId = croc.utils.objUniqueId(field);
        
        if (this.__offRevalidate[fieldId]) {
            return;
        }
        
        if (this.__validationManager.getValidated() || field.getInvalidMessage()) {
            //noinspection FunctionWithInconsistentReturnsJS
            this.__validationManager.validateItem(field, function(ex) {
                if (!changed) {
                    return false;
                }
            });
        }
    },
    
    /**
     * @param {croc.ui.form.field.IField} field
     * @private
     */
    __setUpFieldValidation: function(field) {
        if (field.getIdentifier() && this.__validationManager.hasItem(field)) {
            setTimeout(function() {
                if (this.fieldsInvalidMessages && this.fieldsInvalidMessages[field.getIdentifier()]) {
                    this.getNotifier().setTooltipAutoOpen(false);
                    this.__validationManager.setInvalidItem(field, this.fieldsInvalidMessages[field.getIdentifier()]);
                    this.getNotifier().setTooltipAutoOpen(true);
                    delete this.fieldsInvalidMessages[field.getIdentifier()];
                }
            }.bind(this), 100);
        }
        
        if (croc.Interface.check(field, 'croc.ui.form.field.ITextField')) {
            this.__resetValidationOnFocus(field);
        }
        
        field.on('changeValue', function() {
            if (!this.__validationManager.hasItem(field)) {
                return;
            }
            
            if (this.validationBehavior.resetStateOnEvent) {
                this.__validationManager.resetValidation();
            }
            else if (this.validationBehavior.revalidateFieldOnChangeValue && !this.__preventRevalidation[field.getUniqueId()]) {
                this.__revalidateField(field, true);
            }
        }, this);
    },
    
    /**
     * @private
     */
    __setUpFormValidationBehavior: function() {
        var disposer = new croc.util.Disposer();
        this.__validationManager.on('itemValidated', function(item) {
            if (item === this.form) {
                if (item.getValid() === false) {
                    disposer.addListener(this.form.getStateManager(), 'updateState', function() {
                        this.__validationManager.resetValidatedItem(this.form);
                    }, this);
                }
                else {
                    disposer.disposeAll();
                }
            }
        }, this);
    }
});
