croc.ns('croc.ui.form.internal');

/**
 * Контроллер инкапсулирует логику отправки формы
 * @extends {croc.Object}
 * @event changeSubmitting
 * @internal
 */
croc.ui.form.internal.SubmitController = croc.extend(croc.Object, {
    
    /**
     * Экшен формы либо url, на который будет отправлен запрос
     * @type {string}
     */
    action: '',
    
    /**
     * Если передан, то запрос отправляется в форме {url: ..., data: [{action: ajaxAction, params: formValue}]
     * @type {boolean}
     */
    ajaxAction: null,
    
    /**
     * Задержка перед сабмитом формы аяксом
     * @type {number}
     */
    ajaxSubmitDelay: null,
    
    /**
     * Фукнкция вызывается при сабмите формы. Должна возвращать Deferred, resolve вызывается при получении ответа
     * с сервера. На время сабмита кнопка submit становится неактивной и показывается лоадер. Если опция передана
     * то preventSubmit устанавливается в true.
     * Важно! Для статистики в resolve должно передаваться true если сабмит был удачным. Также должно вызываться
     * событие submitServerError если с сервера пришла ошибка.
     * @type {function(this: croc.ui.form.Form, croc.ui.form.Form, Object.<string, *>):$.Deferred}
     */
    ajaxSubmitFn: null,
    
    /**
     * Форма отправляет данные аяксом самостоятельно. После чего вызывается метод _onSubmitSuccess или _onSubmitFail
     * @type {boolean}
     */
    autoAjaxSubmit: false,
    
    /**
     * Ошибки формы
     * @type {Object}
     */
    errorCodes: null,
    
    /**
     * форма
     * @type {croc.ui.form.Form}
     * @required
     */
    form: null,
    
    /**
     * Предотвратить отправку формы на сервер
     * @type {boolean}
     */
    preventSubmit: false,
    
    /**
     * @type {Function}
     * @required
     */
    submitFailFunc: null,
    
    /**
     * @type {Function}
     * @required
     */
    submitSuccessFunc: null,
    
    /**
     * Нужно ли триммить значения всех текстовых полей перед сабмитом
     * @type {boolean}
     */
    trimAllBeforeSubmit: true,
    
    /**
     * Функция для получения значений формы для отправки на сервер
     * @type {Function}
     * @required
     */
    valuesFunc: null,
    
    init: function() {
        this.__enableSubmit = false;
        this.form.getElement().on('submit', this.__onFormElSubmit.bind(this));
    },
    
    /**
     * Запрещён ли сабмит формы в данный момент
     * @returns {boolean}
     */
    isSubmitBlocked: function() {
        return !!this.__submitBlocked;
    },
    
    /**
     * Произведён ли уже статический сабмит (момент перед отправкой формы)
     * @returns {boolean}
     */
    isSubmitPerformed: function() {
        return !!this.__submitPerformed;
    },
    
    /**
     * Изменить время задержки до отправки запроса
     * @param {number} delay
     */
    setAjaxSubmitDelay: function(delay) {
        this.ajaxSubmitDelay = delay;
    },
    
    /**
     * Отправить форму. Форма отправляется, только если пройдена валидация.
     * @returns {$.Deferred} resolve - если форма отправлена, reject в противном случае
     */
    submit: function() {
        if (this.__submitBlocked) {
            return this.__submitDeferred;
        }
        this.__submitDeferred = $.Deferred();
        
        this.form.commitChanges();
        
        var prevented = false;
        this.form.fireEvent('presubmit', function() { prevented = true; });
        if (prevented) {
            this.__submitDeferred.reject();
            return this.__submitDeferred;
        }
        
        this.__preprocessFields();
        
        this.__submitBlock();
        
        this.form.validate().done(function(valid) {
            if (valid) {
                this.__enableSubmit = true;
                this.form.getElement().submit();
                this.form.fireEvent('postsubmit');
                this.__enableSubmit = false;
            }
            else {
                this.form.fireEvent('submitValidationFail');
                this.__submitUnblock();
                this.__submitDeferred.reject();
            }
        }.bind(this));
        
        return this.__submitDeferred;
    },
    
    /**
     * @param form
     * @private
     */
    __ajaxSubmit: function(form) {
        var values = this.valuesFunc();
        var showMessages = true;
        return stm.ajax({
            url: this.action,
            data: this.ajaxAction ? [
                {action: this.ajaxAction, params: values}
            ] : values,
            delayRequest: this.ajaxSubmitDelay
        }, this)
            
            .then(function(response) {
                showMessages = this.submitSuccessFunc(response, values);
                if (showMessages !== false) {
                    showMessages = true;
                }
                return response;
            }.bind(this), this.submitFailFunc.bind(this))
            
            .then(
            function(response) {
                var result = response && (Array.isArray(response.result) ? response.result[0].data : response.result);
                var errcode = response && (response.errcode ||
                    (Array.isArray(response.result) && response.result[0] && response.result[0].errcode));
                var error = errcode && (response.errcode ? response.msg : response.result[0].msg);
                
                if (errcode || (result && (result.errors || result.validation_errors))) {
                    if (showMessages) {
                        error = error || (result && result.validation_errors && result.validation_errors.global) ||
                        (this.errorCodes && this.errorCodes[response.errcode]);
                        
                        if (error) {
                            if (typeof error === 'string') {
                                this.form.getValidationManager().setInvalidItem(this.form, error);
                            }
                            else {
                                this.form.getValidationManager()
                                    .setInvalidItem(this.form.getItem(error.field), error.message);
                                error = JSON.stringify(error);
                            }
                        }
                        
                        var errors = response.errors || (result && result.validation_errors);
                        if (typeof errors === 'object') {
                            _.forOwn(errors, function(message, name) {
                                var field = this.form.getItem(name);
                                if (message && field) {
                                    this.form.getValidationManager().setInvalidItem(field, message);
                                }
                            }, this);
                            
                            if (!error) {
                                error = JSON.stringify(errors);
                            }
                        }
                    }
                    
                    return $.Deferred().resolve((error || 'errcode =') + ' ' + response.errcode, response);
                }
                
                return $.Deferred().resolve(null, response);
            }.bind(this),
            function(response) {
                return response;
            });
    },
    
    /**
     * Дублируем заблокированные поля, иначе они не отправятся в POST данных
     * @private
     */
    __duplicateDisabledInputs: function() {
        this.form.getElement()
            .find('input[disabled],textarea[disabled],select[disabled]')
            .filter('[name]')
            .each(function() {
                var el = $(this);
                var clone = el.clone().prop('disabled', false).hide();
                if (clone.is('select,textarea')) {
                    clone.val(el.val());
                }
                clone.insertAfter(el);
            });
    },
    
    /**
     * @private
     */
    __onFormElSubmit: function(e) {
        if (!this.__enableSubmit) {
            e.preventDefault();
            this.submit();
        }
        else {
            this.form.fireEvent('submit', e, this.form.getValues());
            
            if (e.isDefaultPrevented()) {
                this.__submitUnblock();
                return;
            }
            
            if (this.preventSubmit || this.ajaxSubmitFn || this.autoAjaxSubmit) {
                e.preventDefault();
            }
            else {
                this.__submitPerformed = true;
                this.__duplicateDisabledInputs();
            }
            
            var submitFn = this.ajaxSubmitFn;
            if (!submitFn && this.autoAjaxSubmit) {
                submitFn = this.__ajaxSubmit;
            }
            
            if (submitFn) {
                submitFn.call(this, this.form, this.form.getValues())
                    .then(
                    function(error, response) {
                        this.__submitUnblock();
                        if (error) {
                            this.__submitDeferred.reject();
                            this.form.fireEvent('submitServerError', error);
                        }
                        else {
                            this.__submitSuccessful(false, response);
                        }
                    }.bind(this),
                    function(response) {
                        this.__submitUnblock();
                        this.__submitDeferred.reject();
                        this.form.fireEvent('submitServerError', 'errcode = ' + (response && response.status));
                    }.bind(this));
            }
            else if (!this.__submitPerformed) {
                this.__submitUnblock();
                this.__submitDeferred.resolve();
            }
            else {
                this.__submitSuccessful(true);
            }
        }
    },
    
    /**
     * @private
     */
    __preprocessFields: function() {
        this.form.getItems().forEach(function(field) {
            
            if (this.trimAllBeforeSubmit &&
                croc.Interface.check(field, 'croc.ui.form.field.ITextField') && !field.keepWhiteSpace() &&
                typeof field.getValue() === 'string') {
                
                field.setValue(field.getValue().trim());
            }
            
            field.onSubmit();
        }, this);
    },
    
    /**
     * @private
     */
    __submitBlock: function() {
        this.fireEvent('changeSubmitting', true);
        this.__submitBlocked = true;
        this.form.disable();
        var submitButton = this.form.getSubmitButton();
        if (submitButton) {
            this.__loadingButtonDescriptor = this._getDisposer().setTimeout(function() {
                submitButton.setLoading(true);
            }, 300);
        }
    },
    
    /**
     * @private
     */
    __submitSuccessful: function(isStatic, response) {
        this.form.getValidationManager().resetValidation();
        this.__submitDeferred.resolve();
        this.form.fireEvent('submitSuccessful', response, isStatic);
    },
    
    /**
     * @private
     */
    __submitUnblock: function() {
        this.fireEvent('changeSubmitting', false);
        this.__submitBlocked = false;
        this.form.enable();
        if (this.form.getSubmitButton()) {
            this.form.getSubmitButton().setLoading(false);
            this.__loadingButtonDescriptor.remove();
        }
    }
});
