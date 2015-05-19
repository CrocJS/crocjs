/**
 * Form widget which contains fields (section 'fields', by default) and buttons (section 'buttons').
 */
croc.Class.define('croc.cmp.form.Form', {
    extend: croc.cmp.Widget,
    implement: croc.cmp.form.validation.IValidatable,
    include: croc.cmp.form.validation.MStandardValidatable,
    
    events: {
        /**
         * валидация была пройдена, чтобы отменить стандартный сабмит формы, вызовите e.preventDefault()
         * @param {Event} e
         * @param {Object.<string, *>} value
         */
        submit: null,
        
        /**
         * @param {string} error
         */
        submitServerError: null,
        
        /**
         * активация формы (первое взаимодействие с одним из полей формы)
         * @param {croc.cmp.form.field.IField} field
         */
        activate: null,
        
        /**
         * возбуждается после инициализации состояния (_initSate), а также после каждого ресета
         */
        initState: null,
        
        /**
         * @param {Object} response
         * @param {boolean} staticSubmit
         */
        submitSuccessful: null,
        
        submitValidationFail: null,
        
        /**
         * @param {function} prevent
         */
        presubmit: null,
        
        postsubmit: null
    },
    
    properties: {
        /**
         * @type {boolean}
         */
        disabled: {
            value: false,
            model: true
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
         * Значения, которые следует установить полям при их добавлении
         * @type {Object.<string, *>}
         */
        fieldsValues: null,
        
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
        this.__alreadyDisabled = {};
        
        this.on('addChild', function(widget) {
            if (widget.getSection() === 'buttons') {
                if (!this.__submitButton && widget.getType() === 'submit') {
                    this.__submitButton = widget;
                }
            }
            else if (widget.getSection() === 'fields') {
                this.__onAddField(widget);
            }
        }, this);
        
        this.on('removeChild', function(widget) {
            if (this.__submitButton === widget) {
                this.__submitButton = null;
            }
            if (widget.getSection() === 'fields') {
                this.__stateManager.removeItem(widget);
                if (this.__activateDisposer) {
                    this.__activateDisposer.removeObject(widget);
                }
            }
        }, this);
        
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
         * Секция дочерних элементов по-умолчанию
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return 'fields';
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
            return this.__submitButton;
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
         * Passed element will be hidden on the first form update
         * @param {Element|jQuery} el
         * @param {string} [method='hide'] jquery hide method
         */
        hideElementOnUpdate: function(el, method) {
            this.__stateManager.once('updateStateChanged', function() {
                $(el)[method || 'hide']();
            });
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
            this.__submitButton = button;
            if (button.getType() !== 'submit') {
                button.on('click', function() {
                    this.submit();
                }, this);
            }
        },
        
        /**
         * Passed element will be shown when form state changes and hidden when form state returns back
         * @param {Element|jQuery} el
         * @param {string} [method='toggle'] jquery toggle method
         */
        showElementIfChanged: function(el, method) {
            this.__stateManager.on('updateStateChanged', function(value) {
                $(el)[method || 'toggle'](value);
            });
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
         * @param {boolean|string} [disable=false] делает поле недоступным не скрывая его
         * @param {string|function(jQuery, boolean)} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
         */
        toggleField: function(field, available, disable, toggleMethod) {
            if (typeof field === 'string') {
                field = /** @type {croc.cmp.form.field.IField} */(this.getItem(field));
            }
            if (disable) {
                field.setDisabled(!available);
            }
            else {
                this.__toggleFieldVisibility(field, available, toggleMethod);
                
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
         * Значения для отправки на сервер аяксом
         * @returns {Object}
         * @protected
         */
        _getSubmitValues: function() {
            return this.getValues();
        },
    
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.Form.superclass._initModel.apply(this, arguments);
            this.__stateManager = new croc.cmp.form.StateManager(this._options.stateManager || {});
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
            var options = this._options;
            this.__validationController = new croc.cmp.form.validation.Controller({
                form: this,
                notifierConf: options.notifier,
                validationBehavior: options.validationBehavior,
                validateForm: options.validateForm,
                fieldsInvalidMessages: options.fieldsInvalidMessages
            });
            this.__validationManager = this.__validationController.getManager();
            this.__notifier = this.__validationController.getNotifier();
            this.__submitController = new croc.cmp.form.internal.SubmitController({
                form: this,
                action: options.action,
                ajaxAction: options.ajaxAction,
                ajaxSubmitDelay: options.ajaxSubmitDelay,
                ajaxSubmitFn: options.ajaxSubmitFn,
                autoAjaxSubmit: options.autoAjaxSubmit,
                errorCodes: options.errorCodes,
                preventSubmit: options.preventSubmit,
                submitFailFunc: this._onSubmitFail.bind(this),
                submitSuccessFunc: this._onSubmitSuccess.bind(this),
                trimAllBeforeSubmit: this.trimAllBeforeSubmit,
                valuesFunc: (options.submitValuesFn || this._getSubmitValues).bind(this)
            });
            
            this.__submitController.bind(':changeSubmitting', this, '__submitting');
            
            //call parent
            croc.cmp.form.Form.superclass._initWidget.call(this);
            
            this.listenProperty('disabled', this.__applyDisabled, this);
            
            if (!this._partialInitialState) {
                this._initState();
            }
        },
        
        /**
         * ajax-запрос был выполнен неудачно
         * @protected
         */
        _onSubmitFail: function(response) {},
        
        /**
         * ajax-запрос был выполнен удачно
         * @param response
         * @param values
         * @protected
         */
        _onSubmitSuccess: function(response, values) {},
        
        /**
         * @param {croc.cmp.form.field.IField} field
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
         */
        __applyDisabled: function(value) {
            if (value) {
                this.__alreadyDisabled = {};
            }
            
            this.getItems().concat(this.getItems('buttons')).forEach(function(widget) {
                if (croc.Interface.check(widget, 'croc.cmp.form.field.IDisable') ||
                    croc.Class.check(widget, 'croc.cmp.form.Button')) {
                    if (!value) {
                        if (!this.__alreadyDisabled[widget.getUniqueId()]) {
                            widget.setDisabled(false);
                        }
                    }
                    else if (widget.getDisabled()) {
                        this.__alreadyDisabled[widget.getUniqueId()] = true;
                    }
                    else {
                        widget.setDisabled(true);
                    }
                }
            }, this);
        },
        
        /**
         * @private
         */
        __onAddField: function(item) {
            var field = /** @type {croc.cmp.form.field.IField} */(item);
            var meta = item.getMeta();
            
            this.__stateManager.addItem(field, {dontReset: field.getMeta().dontReset});
            
            //activation
            this.__setUpFieldActivation(field);
            
            //initial value
            var initialValue = this._options.fieldsValues && this._options.fieldsValues[field.getIdentifier()];
            if (initialValue) {
                var initValue = function() {
                    field.setValue(initialValue);
                    delete this._options.fieldsValues[field.getIdentifier()];
                }.bind(this);
                initValue();
                
                if (croc.isClient) {
                    //если значения будут перекрыты браузером
                    this._getDisposer().setTimeout(initValue, 100);
                }
            }
            
            //todo field defaults
            //if (meta.setDefaults) {
            //    (Array.isArray(meta.setDefaults) ? meta.setDefaults : [meta.setDefaults])
            //        .forEach(function(type) {
            //            croc.cmp.form.Form.setFieldDefaults(type, field);
            //        });
            //}
        },
        
        /**
         * @param {croc.cmp.form.field.IField} field
         * @private
         */
        __setUpFieldActivation: function(field) {
            if (this.__activateDisposer) {
                if (croc.Interface.check(field, 'croc.cmp.form.field.IHtmlControl')) {
                    this.__activateDisposer.addListener(field, 'changeFocused', function(value) {
                        if (value) {
                            this.__activateForm(field);
                        }
                    }, this);
                }
                this.__activateDisposer.addListener(field.getElement(), 'mousedown',
                    this.__activateForm.bind(this, field));
            }
        },
        
        /**
         * @param {string|croc.cmp.form.field.IField} field
         * @param {boolean} available
         * @param {string|Function} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
         * @private
         */
        __toggleFieldVisibility: function(field, available, toggleMethod) {
            var el = field.getElement().closest(this.getSubElementSelector('fieldWrapper'));
            if (!el.length) {
                el = field.getElement();
            }
            
            if (typeof toggleMethod === 'function') {
                toggleMethod(el, available);
            }
            else {
                if (!toggleMethod) {
                    el.toggle(available);
                }
                else {
                    var method = available ?
                        {fade: 'fadeIn', slide: 'slideDown'}[toggleMethod] :
                        {fade: 'fadeOut', slide: 'slideUp'}[toggleMethod];
                    el[method]();
                }
            }
        }
    }
});