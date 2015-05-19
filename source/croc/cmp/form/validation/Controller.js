/**
 * Контроллер инкапсулирует стандартное взаимодействие формы с менеджером валидации
 * @extends {croc.Object}
 * @internal
 */
croc.Class.define('croc.cmp.form.validation.Controller', {
    extend: croc.Object,
    
    options: {
        /**
         * Ошибки валидации полей, которые следует установить при их полявлении
         * @type {Object.<string, string>}
         */
        fieldsInvalidMessages: null,
        
        /**
         * форма
         * @type {croc.cmp.form.Form}
         * @required
         */
        form: null,
        
        notifierConf: {
            extend: true,
            value: {}
        },
        
        /**
         * Опции устанавливающие особенности валидации формы
         * @type {Object}
         */
        validationBehavior: {
            extend: true,
            value: {
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
            }
        },
        
        /**
         * Нужно ли производить валидацию формы
         * @type {boolean}
         */
        validateForm: true
    },
    
    construct: function() {
        this.__offRevalidate = {};
        this.__preventRevalidation = {};
        
        this.__validationManager = new croc.cmp.form.validation.Manager();
        this.__validationManager.addItem(this._options.form, {weight: 100});
        
        //notifier
        this._options.notifierConf.validationManager = this.__validationManager;
        this.__notifier = new croc.cmp.form.validation.Notifier(this._options.notifierConf);
        this.__notifier.setTooltipAutoOpen(false);
        
        this._options.form.on({
            addChild: function(field) {
                if (field.getSection() !== 'fields') {
                    return;
                }
                
                var meta = field.getMeta();
                this.__validationManager.addItem(field, {
                    identifier: field.getIdentifier(),
                    suppressValid: meta.suppressValid
                });
                
                this.__setUpFieldValidation(field);
            },
            removeChild: function(field) {
                if (field.getSection() === 'fields') {
                    this.__validationManager.removeItem(field);
                }
            }
        }, this);
        
        this.__setUpFormValidationBehavior();
    },
    
    members: {
        /**
         * @returns {croc.cmp.form.validation.Manager}
         */
        getManager: function() {
            return this.__validationManager;
        },
        
        /**
         * @returns {croc.cmp.form.validation.Notifier}
         */
        getNotifier: function() {
            return this.__notifier;
        },
        
        /**
         * Отключить повторную валидацию поля при потере фокуса
         * @param {croc.cmp.form.field.IField} field
         */
        offFieldRevalidating: function(field) {
            this.__offRevalidate[croc.utils.objUniqueId(field)] = true;
        },
        
        trySubmit: function(successCallback, failCallback, context) {
            if (!context) {
                context = global;
            }
            
            if (this._options.validateForm && !Stm.env.formDisableValidation) {
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
            if (this._options.validateForm && !Stm.env.formDisableValidation) {
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
         * @param {croc.cmp.form.field.ITextField} field
         * @private
         */
        __resetValidationOnFocus: function(field) {
            var changed = false;
            var updateListener = function() {
                changed = true;
            };
            
            field.on('changeFocused', function(focused) {
                if (focused) {
                    this.__preventRevalidation[field.getUniqueId()] = true;
                    
                    if (this.__validationManager.hasItem(field) &&
                        (this.__validationManager.getValidated() || field.getInvalidMessage()) &&
                        (!croc.Interface.check(field, 'croc.cmp.form.field.IDisable') || !field.getDisabled())) {
                        
                        if (croc.Interface.check(field, 'croc.cmp.form.field.IUpdatableField')) {
                            field.on('changeInstantValue', updateListener);
                        }
                        
                        if (this._options.validationBehavior.resetStateOnEvent) {
                            this.__validationManager.resetValidation();
                        }
                        else if (this._options.validationBehavior.resetTextFieldOnFocus) {
                            this.__validationManager.resetValidatedItem(field);
                        }
                    }
                }
                else {
                    delete this.__preventRevalidation[field.getUniqueId()];
                    
                    if (this.__validationManager.hasItem(field) &&
                        (!croc.Interface.check(field, 'croc.cmp.form.field.IDisable') || !field.getDisabled())) {
                        if (this._options.validationBehavior.revalidateTextFieldOnBlur) {
                            this.__revalidateField(field, changed);
                        }
                        
                        if (croc.Interface.check(field, 'croc.cmp.form.field.IUpdatableField')) {
                            field.un('changeInstantValue', updateListener);
                        }
                        
                        changed = false;
                    }
                }
            }, this);
        },
        
        /**
         * @param {croc.cmp.form.field.IField} field
         * @param {boolean} changed
         * @private
         */
        __revalidateField: function(field, changed) {
            if (this.__offRevalidate[field.getUniqueId()]) {
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
         * @param {croc.cmp.form.field.IField} field
         * @private
         */
        __setUpFieldValidation: function(field) {
            var messages = this._options.fieldsInvalidMessages;
            if (croc.isClient && messages && field.getIdentifier() && this.__validationManager.hasItem(field)) {
                setTimeout(function() {
                    if (messages && messages[field.getIdentifier()]) {
                        this.getNotifier().setTooltipAutoOpen(false);
                        this.__validationManager.setInvalidItem(field, messages[field.getIdentifier()]);
                        this.getNotifier().setTooltipAutoOpen(true);
                        delete messages[field.getIdentifier()];
                    }
                }.bind(this), 100);
            }
            
            if (croc.Interface.check(field, 'croc.cmp.form.field.ITextField')) {
                this.__resetValidationOnFocus(field);
            }
            
            field.on('changeValue', function() {
                if (!this.__validationManager.hasItem(field)) {
                    return;
                }
                
                if (this._options.validationBehavior.resetStateOnEvent) {
                    this.__validationManager.resetValidation();
                }
                else if (this._options.validationBehavior.revalidateFieldOnChangeValue && !this.__preventRevalidation[field.getUniqueId()]) {
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
                if (item === this._options.form) {
                    if (item.getValid() === false) {
                        disposer.addListener(this._options.form.getStateManager(), 'updateState', function() {
                            this.__validationManager.resetValidatedItem(this._options.form);
                        }, this);
                    }
                    else {
                        disposer.disposeAll();
                    }
                }
            }, this);
        }
    }
});
