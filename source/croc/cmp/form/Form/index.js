/**
 * Form widget which contains fields (section 'fields', by default) and buttons (section 'buttons').
 */
croc.Class.define('croc.cmp.form.Form', {
    extend: croc.cmp.Widget,
    implement: croc.cmp.form.validation.IValidatable,
    include: croc.cmp.form.validation.MStandardValidatable,
    
    statics: {
        FIELD_ID_PREFIX: 'croc-form-field-'
    },
    
    events: {
        /**
         * api-ru валидация была пройдена, чтобы отменить стандартный сабмит формы, вызовите e.preventDefault()
         * api-en Validation was passed, to cancel standard form submit, call e.preventDefault()
         * @param {Event} e
         * @param {Object.<string, *>} value
         */
        submit: null,
        
        /**
         * @param {string} error
         */
        submitServerError: null,
        
        /**
         * api-ru активация формы (первое взаимодействие с одним из полей формы)
         * api-en Form activation (first interaction with one of form fields)
         * @param {croc.cmp.form.field.IField} field
         */
        activate: null,
        
        /**
         * api-ru возбуждается после инициализации состояния (_initSate), а также после каждого ресета
         * api-en Initiates after initialization state (_initSate), and also after every reset.
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
         * api-ru Идёт ли отправка данных в данный момент
         * api-en Is it submitting right now?
         * @type {boolean}
         */
        submitting: {
            value: false,
            __setter: null,
            event: true
        },
        
        /**
         * api-ru Предупреждать пользователя о несохранённых изменениях
         * api-en Warn user about unsaved changes.
         * @type {boolean}
         */
        warnUnsavedChanges: {
            value: false,
            option: true
        }
    },
    
    options: {
        /**
         * api-ru Экшен формы либо url, на который будет отправлен запрос
         * api-en Form action or url to which a request are sent
         * @type {string}
         */
        action: {},
        
        /**
         * Expected type of child widget associated with section name
         * @type {Object.<string, Function|Object|string|Array>}
         */
        checkChild: {
            value: {
                fields: 'croc.cmp.form.field.IField',
                buttons: 'croc.cmp.form.Button'
            }
        },
        
        /**
         * api-ru Значения, которые следует установить полям при их добавлении
         * api-en Values, which should set to fields with their add.
         * @type {Object.<string, *>}
         */
        fieldsValues: null,
        
        /**
         * api-ru Предотвратить отправку формы на сервер
         * api-en Prevent submission of form to server.
         * @type {boolean}
         */
        preventSubmit: false,
        
        /**
         * api-ru Конфигурация добавляемых лэйблов
         * api-en Configuration of add labels.
         * @type {object}
         */
        labels: {
            extend: true,
            value: {
                /**
                 * api-ru размер подсказки
                 * api-en Hint size. 
                 * @type {number}
                 */
                hintSize: 12,
                
                /**
                 * api-ru размер лэйблов (1-5)
                 * api-en Labels size (1-5)
                 * @type {string}
                 */
                size: '1',
                
                /**
                 * api-ru положение лэйблов
                 * api-en Labels position.
                 * @type {string}
                 */
                position: 'top'
            }
        },
        
        /**
         * Конфигурация для менеджера состояний
         * @type {Object}
         */
        stateManager: null,
        
        /**
         * api-ru Функция получения значений перед отправкой данных на сервер
         * api-en Function of values reception before submitting to server.
         * @type {function():Object}
         */
        submitValuesFn: {},
        
        /**
         * api-ru Нужно ли триммить значения всех текстовых полей перед сабмитом
         * api-en Is it necessary to trim values of all text fields before submit?
         * @type {boolean}
         */
        trimAllBeforeSubmit: true,
        
        /**
         * api-ru Нужно ли производить валидацию формы
         * api-en Is it necessary to execute form validation?
         * @type {boolean}
         */
        validateForm: true,
        
        /**
         * api-ru Опции устанавливающие особенности валидации формы {@see croc.cmp.form.validation.Controller#validationBehavior}
         * api-en Options which set behavior of form validation {@see croc.cmp.form.validation.Controller#validationBehavior}
         * @type {Object}
         */
        validationBehavior: null,
        
        /**
         * api-ru Игнорировать определённые поля, предупреждая о несохранённых изменениях
         * api-en Ignore certain fields, warning about unsaved changes.
         * @type {Array.<string>}
         */
        warnUnsavedChangesIgnoreFields: null
    },
    
    construct: function() {
        this.__activateDisposer = new croc.util.Disposer();
        this.__alreadyDisabled = {};
        
        this.on('initChild', function(widget) {
            if (widget.getSection() === 'fields') {
                var size = this.getVar('fieldSize');
                if (size && croc.Interface.check(widget, 'croc.cmp.form.field.ISizable') &&
                    !_.contains(widget._passedOptions, 'size')) {
                    widget._model.set('size', size);
                }
            }
        }, this);
        
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
         * api-ru Снимает фокус с выделенного поля формы, а затем возвращает его, для того чтобы зафиксировать изменения этого поля.
         * api-en Removes focus from selected field form, and then returns it, in order to capture changes of this field.
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
         * @returns {string}
         */
        generateFieldId: function() {
            return this.generateUniqueId(croc.cmp.form.Form.FIELD_ID_PREFIX);
        },
        
        /**
         * api-ru Секция дочерних элементов по-умолчанию
         * api-en Default child elements section.
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return 'fields';
        },
        
        /**
         * api-ru Объект уведомлений
         * api-en Notifier object.
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
         * api-ru Возвращает первую кнопку типа submit
         * api-en Returns first button of submit type.
         * @return {croc.cmp.form.Button}
         */
        getSubmitButton: function() {
            return this.__submitButton;
        },
        
        /**
         * api-ru Менеджер валидации
         * api-en Validation manager.
         * @return {croc.cmp.form.validation.Manager}
         */
        getValidationManager: function() {
            return this.__validationManager;
        },
        
        /**
         * api-ru Получить значения полей формы в виде объекта.
         *        Алиас к {@link #getValues} для поддержки интерфейса {@link croc.cmp.form.validation.IValidatable}.
         * api-en Get values of form fields as an object.
         *        Alias to {@link #getValues} for support interface {@link croc.cmp.form.validation.IValidatable}.
         * @return {Object.<string, *>}
         */
        getValue: function() {
            return this.getValues();
        },
        
        /**
         * api-ru Получить значения полей формы в виде объекта
         * api-en Get values of form fields as an object.
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
         * api-ru Отключить повторную валидацию поля при потере фокуса
         * api-en Disable field revalidation at focus loss.
         * @param {croc.cmp.form.field.IField} field
         */
        offFieldRevalidating: function(field) {
            this.__validationController.offFieldRevalidating(field);
        },
        
        /**
         * api-ru Сбросить значения и состояния полей
         * api-en Reset fields values and conditions.
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
         * api-ru Явно назначить кнопку отправки формы
         * api-en Set submit button 
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
         * api-ru Отправить форму. Форма отправляется, только если пройдена валидация.
         * api-ru @returns {$.Deferred} resolve - если форма отправлена, reject в противном случае
         * api-en Submit form. Form submits only if validation was passed.
         * api-en @returns {$.Deferred} resolve - if form was submited, reject the otherwise
         */
        submit: function() {
            return this.__submitController.submit();
        },
        
        /**
         * @param {string|croc.cmp.form.field.IField} field
         * @param {boolean} available
         * api-ru Изменить доступность поля (видимость/disable и необходимость валидации)
         * api-ru @param {boolean|string} [disable=false] делает поле недоступным не скрывая его
         * api-ru @param {string|function(jQuery, boolean)} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
         * api-en Set field as disabled.
         * api-en @param {boolean|string} [disable=false] set field disabled but not hidden
         * api-en @param {string|function(jQuery, boolean)} [toggleMethod=null] null|fade|slide - show/hide animation method of field
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
         * api-ru Произвести валидацию полей формы
         * api-en Execute form fiels validation
         * @returns {$.Deferred}
         */
        validate: function() {
            return this.__validationController.validate();
        },
        
        /**
         * api-ru Значения для отправки на сервер аяксом
         * api-ru Values for submit to server by AJAX
         * @returns {Object}
         * @protected
         */
        _getSubmitValues: function() {
            return this.getValues();
        },
        
        /**
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.Form.superclass._initModel.apply(this, arguments);
            
            var options = this._options;
            this.__stateManager = new croc.cmp.form.StateManager(options.stateManager || {});
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
        },
        
        /**
         * api-ru После вызова состояние формы считается начальным
         * api-en After the call form statement regards initial
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
         * api-ru Инициализация виджета после его отрисовки в DOM
         * api-en Initialization  of widget after its rendering in DOM.
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.Form.superclass._initWidget.call(this);
            
            this.listenProperty('disabled', this.__applyDisabled, this);
            if (!this._partialInitialState) {
                this._initState();
            }
        },
        
        /**
         * api-ru ajax-запрос был выполнен неудачно
         * api-en Ajax-query was executed wrong
         * @protected
         */
        _onSubmitFail: function(response) {},
        
        /**
         * api-ru ajax-запрос был выполнен удачно
         * api-en query was executed successful
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
                    // * api-ru если значения будут перекрыты браузером
                    // * api-en if values would be overwritten by browser
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
         * api-ru @param {string|Function} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
         * api-en @param {string|Function} [toggleMethod=null] null|fade|slide - show/hide animation method of field
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