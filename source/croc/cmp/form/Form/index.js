/**
 * Форма
 */
croc.Class.define('croc.cmp.form.Form', {
    extend: croc.cmp.Widget,
    
    properties: {
        /**
         * @type {boolean}
         */
        disabled: {
            value: false,
            apply: '__applyDisabled'
        },
        
        status: {
            value: 'normal',
            check: ['normal', 'sentSuccess', 'sentFailure'],
            __setter: null
        },
        
        /**
         * Идёт ли отправка данных в данный момент
         * @type {boolean}
         */
        submitting: {
            value: false,
            __setter: null,
            event: true
        },
        
        /**
         * Предупреждать пользователя о несохранённых изменениях
         * @type {boolean}
         */
        warnUnsavedChanges: {
            value: false,
            option: true
        }
    },
    
    options: {
        /**
         * Экшен формы либо url, на который будет отправлен запрос
         * @type {string}
         */
        action: {},
        
        /**
         * Предотвратить отправку формы на сервер
         * @type {boolean}
         */
        preventSubmit: false,
        
        /**
         * Функция получения значений перед отправкой данных на сервер
         * @type {function():Object}
         */
        submitValuesFn: {},
        
        /**
         * Нужно ли триммить значения всех текстовых полей перед сабмитом
         * @type {boolean}
         */
        trimAllBeforeSubmit: true,
        
        /**
         * Нужно ли производить валидацию формы
         * @type {boolean}
         */
        validateForm: true,
        
        /**
         * Опции устанавливающие особенности валидации формы {@see croc.cmp.form.validation.Controller#validationBehavior}
         * @type {Object}
         */
        validationBehavior: null,
        
        /**
         * Игнорировать определённые поля, предупреждая о несохранённых изменениях
         * @type {Array.<string>}
         */
        warnUnsavedChangesIgnoreFields: null
    },
    
    construct: function() {
        this.__activateDisposer = new croc.util.Disposer();
        croc.cmp.form.Form.superclass.construct.apply(this, arguments);
    },
    
    destruct: function() {
        this.__notifier.dispose();
    },
    
    members: {
        /**
         * Снимает фокус с выделенного поля формы, а затем возвращает его, для того чтобы зафиксировать изменения
         * этого поля.
         */
        commitChanges: function() {
            if (document.activeElement && document.activeElement.blur &&
                this.getElement().has(document.activeElement).length) {
                document.activeElement.blur();
                document.activeElement.focus();
            }
            
            this.getElement()
                .find('input[type=text], input[type=textarea], input[type=password]')
                .blur();
        },
        
        /**
         * Объект уведомлений
         * @return {croc.cmp.form.validation.Notifier}
         */
        getNotifier: function() {
            return this.__notifier;
        },
        
        /**
         * @returns {croc.cmp.form.StateManager}
         */
        getStateManager: function() {
            return this.__stateManager;
        },
        
        /**
         * Возвращает первую кнопку типа submit
         * @return {croc.cmp.form.Button}
         */
        getSubmitButton: function() {
            return this.__sumbitButton;
        },
        
        /**
         * Менеджер валидации
         * @return {croc.cmp.form.validation.Manager}
         */
        getValidationManager: function() {
            return this.__validationManager;
        },
        
        /**
         * Получить значения полей формы в виде объекта.
         * Алиас к {@link #getValues} для поддержки интерфейса {@link croc.cmp.form.validation.IValidatable}.
         * @return {Object.<string, *>}
         */
        getValue: function() {
            return this.getValues();
        },
        
        /**
         * Получить значения полей формы в виде объекта
         * @param {boolean} [complex=false]
         * @param {boolean} [includeEmpty=false]
         * @returns {Object.<string, *>}
         */
        getValues: function(complex, includeEmpty) {
            if (complex || includeEmpty) {
                var values = {};
                this.getItems().forEach(function(item) {
                    if (item.getIdentifier() && (includeEmpty || !item.isEmpty())) {
                        values[item.getIdentifier()] = complex ? item.getValue() : item.getPlainValue();
                    }
                });
                return values;
            }
            return _.assign({}, this.__stateManager.getValues());
        },
        
        /**
         * Отключить повторную валидацию поля при потере фокуса
         * @param {croc.cmp.form.field.IField} field
         */
        offFieldRevalidating: function(field) {
            this.__validationController.offFieldRevalidating(field);
        },
        
        /**
         * Сбросить значения и состояния полей
         */
        reset: function() {
            this.__validationManager.resetValidation();
            this.__stateManager.reset();
            
            if (!this.__activateDisposer) {
                this.__activateDisposer = new croc.util.Disposer();
                this.getItems().forEach(function(field) {
                    this.__setUpFieldActivation(field);
                }, this);
            }
            
            this.fireEvent('initState');
        },
        
        /**
         * Явно назначить кнопку отправки формы
         * @param {croc.cmp.form.Button} button
         */
        setSubmitButton: function(button) {
            this.__sumbitButton = button;
            button.on('execute', function() {
                this.submit();
            }, this);
        },
        
        /**
         * Отправить форму. Форма отправляется, только если пройдена валидация.
         * @returns {$.Deferred} resolve - если форма отправлена, reject в противном случае
         */
        submit: function() {
            return this.__submitController.submit();
        },
        
        /**
         * Изменить доступность поля (видимость/disable и необходимость валидации)
         * @param {string|croc.cmp.form.field.IField} field
         * @param {boolean} available
         * @param {boolean|string} [setDisableOrSelector=false] если true, то делает поле недоступным не скрывая его,
         * если строка, то скрывает поле вплоть до родителя подходящего под переданный селектор
         * @param {string|function(jQuery, boolean)} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
         */
        toggleField: function(field, available, setDisableOrSelector, toggleMethod) {
            if (typeof field === 'string') {
                field = /** @type {croc.cmp.form.field.IField} */(this.getItem(field));
            }
            if (setDisableOrSelector && typeof setDisableOrSelector !== 'string') {
                field.setDisabled(!available);
            }
            else {
                
                this.__toggleFieldVisibility(field, available, setDisableOrSelector, toggleMethod);
                
                if (available) {
                    this.__stateManager.addItem(field, {dontReset: field.getMeta().dontReset});
                }
                else {
                    this.__stateManager.removeItem(field);
                }
            }
            if (available) {
                this.__validationManager.addItem(field,
                    {identifier: field.getIdentifier(), suppressValid: field.getMeta().suppressValid});
            }
            else {
                this.__validationManager.removeItem(field);
            }
        },
        
        /**
         * Произвести валидацию полей формы
         * @returns {$.Deferred}
         */
        validate: function() {
            return this.__validationController.validate();
        },
    
        /**
         * После вызова состояние формы считается начальным
         * @protected
         */
        _initState: function() {
            if (this.__stateInited) {
                return;
            }
            this.__stateInited = true;
        
            this.__stateManager.saveState();
            this.__setUpJsMarkers();
        
            //before unload
            if (this.getWarnUnsavedChanges()) {
                this._getDisposer().addListener(croc, 'system.page.beforeUnload', function(preventUnload) {
                    if (!this.getWarnUnsavedChanges() || this.__submitController.isSubmitPerformed()) {
                        return;
                    }
                
                    this.commitChanges();
                
                    var ignoreFields;
                    if (this.warnUnsavedChangesIgnoreFields) {
                        ignoreFields = [];
                        this.warnUnsavedChangesIgnoreFields.forEach(function(identifier) {
                            ignoreFields.push(this.getItem(identifier));
                        }, this);
                    }
                
                    if (this.__stateManager.getStateChanged(ignoreFields) || this.status === 'sentFailure') {
                        preventUnload('На странице есть несохраненные данные.');
                    }
                }, this);
            }
        
            this.__notifier.setTooltipAutoOpen(true);
        
            this.fireEvent('initState');
        },
    
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            //init members
            this.__stateManager = new croc.ui.form.StateManager(this.stateManager || {});
            this.__validationController = new croc.ui.form.validation.Controller({
                form: this,
                notifierConf: this.notifier,
                validationBehavior: this.validationBehavior,
                validateForm: this.validateForm,
                fieldsInvalidMessages: this.fieldsInvalidMessages
            });
            this.__validationManager = this.__validationController.getManager();
            this.__notifier = this.__validationController.getNotifier();
            this.__submitController = new croc.ui.form.internal.SubmitController({
                form: this,
                action: this.action,
                ajaxAction: this.ajaxAction,
                ajaxSubmitDelay: this.ajaxSubmitDelay,
                ajaxSubmitFn: this.ajaxSubmitFn,
                autoAjaxSubmit: this.autoAjaxSubmit,
                errorCodes: this.errorCodes,
                preventSubmit: this.preventSubmit,
                submitFailFunc: this._onSubmitFail.bind(this),
                submitSuccessFunc: this._onSubmitSuccess.bind(this),
                trimAllBeforeSubmit: this.trimAllBeforeSubmit,
                valuesFunc: (this.submitValuesFn || this._getAjaxSubmitValues).bind(this)
            });
        
            this.__submitController.bind(':changeSubmitting', this, '__submitting');
        
            //call parent
            croc.ui.form.Form.superclass._initWidget.call(this);
        
            this.__buttonsRow = this.getElement().find('.b-form-row:has(.b-sbutton-set)');
            this.__buttonsContainer = this.__buttonsRow.find('.b-sbutton-set');
            if (!this.__buttonsContainer.length) {
                this.__buttonsContainer = this.__buttonsRow;
            }
        
            this.__fieldSet = this.getElement().find('.b-form-fset').filter(':not(.js-form-ignore)');
            this.__messageEl = this.getElement().find('.b-form-replacing-message');
        
            //show buttons row
            if (this.getItems('buttons').length > 0) {
                this.__buttonsRow.removeClass('g-hidden');
            }
        
            if (!this.isHtmlGenerated()) {
                this.__idFieldsLabels();
            }
        
            //overlay
            $('<div class="b-form-overlay" style="display: none"></div>').appendTo(this.getElement());
        
            if (!this._partialInitialState) {
                this._initState();
            }
        },
    
        /**
         * @param {croc.ui.form.field.IField} field
         * @private
         */
        __activateForm: function(field) {
            if (this.__activateDisposer) {
                this.__activateDisposer.disposeAll();
                this.__activateDisposer = null;
                this.fireEvent('activate', field);
            }
        },
        
        /**
         * @private
         * todo simplify
         */
        __applyDisabled: function(value) {
            if (value) {
                this.__alreadyDisabled = {};
                this.getItems().concat(this.getItems('buttons')).forEach(function(widget) {
                    if (croc.Interface.check(widget, 'croc.cmp.form.field.IDisable') ||
                        croc.Class.check(widget, 'croc.cmp.form.Button')) {
                        if (widget.getDisabled()) {
                            this.__alreadyDisabled[widget.getUniqueId()] = true;
                        }
                        else {
                            widget.setDisabled(true);
                        }
                    }
                }, this);
                
                this.__disabledLinks = this.getElement().find('.g-pseudo:not(.state_disabled)');
                this.getElement().add(this.__disabledLinks).addClass('state_disabled');
            }
            else {
                this.getItems().concat(this.getItems('buttons')).forEach(function(widget) {
                    if (croc.Interface.check(widget, 'croc.cmp.form.field.IDisable') ||
                        croc.Class.check(widget, 'croc.cmp.form.Button')) {
                        if (!this.__alreadyDisabled[widget.getUniqueId()]) {
                            widget.setDisabled(false);
                        }
                    }
                }, this);
                
                this.getElement().add(this.__disabledLinks).removeClass('state_disabled');
            }
        },
        
        /**
         * @param {croc.ui.form.field.IField} field
         * @private
         */
        __setUpFieldActivation: function(field) {
            if (this.__activateDisposer) {
                if (croc.Interface.check(field, 'croc.ui.form.field.IHtmlControl')) {
                    this.__activateDisposer.addListener(field, 'focus', this.__activateForm.bind(this, field));
                }
                this.__activateDisposer.addListener(field.getElement(), 'mousedown',
                    this.__activateForm.bind(this, field));
            }
        }
    }
});