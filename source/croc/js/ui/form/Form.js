croc.ns('croc.ui.form');

/**
 * Класс для отображения и валидации формы.
 * Для статистики у каждой формы должен быть xtype. Если форма не имеет своего конкретного типа, то при конструировании
 * формы должна быть передана опция instanceXType.
 *
 * Дочерний виджет может содержать мета данные:
 * dontReset: bool - не сбрасывать значение поля при сбросе значений формы
 * hint: string - подсказка под полем
 * hintSize: number - размер подсказки (если не передан вычисляется на основе размера поля)
 * id: string - атрибут id поля (field element)
 * label: string - лэйбл поля
 * labelHint: string - подсказка к лэйблу поля
 * labelHintSize: number - размер подсказки к лэйблу (если не передан вычисляется на основе размера поля)
 * labelPos: string - позиция лэйбла (left, top)
 * labelSize: number - размер лэйбла (если не передан вычисляется на основе размера поля)
 * offTooltip: boolean - не показывать тултип при ошибке валидации
 * openTooltipAnyway - тултип автоматически всплывает после валидации даже если всплытие запрещено методом setTooltipAutoOpen
 * rowMargin: string - отступ строки сверху (null, half, normal, double)
 * setDefaults: string|Array.<string> - назначить состояние поля по-умолчанию см. {@link croc.ui.form.Form.setFieldDefaults}
 * suppressValid: bool - не помечать поле как прошедшее валидацию
 *
 * - Установить Stm.env.formDisableValidation = true, чтобы отправить данные формы без валидации
 * - Если в форме есть нестандартные поля (лэйбл стоит в нестандартном месте), то можно связать их label с полем,
 * указав для label атрибут: data-form-label-for="name", где name - это имя поля
 * (пока работает только для полей наследников класса AbstractHtmlControl)
 * Если лэйбл стоит в стандартном место, то id расставляются автоматически
 * Логика поиска стандартного лэйбла поля в методе {@link croc.ui.form.Form.getFieldLabel}
 *
 * При инициализации формы из разметки поля и кнопки подхватываются автоматически, если соблюдены следующие условия:
 *  - поля находятся внутри b-form-input-h
 *  - полями не считаются .b-sbutton-set,.b-form-check,.b-form-complex
 *  - .b-input-checkbox лежащий внутри .b-form-input-h>.b-form-check считается полем
 *  - любой элемент с классом js-form-include считается полем
 *  - чтобы запретить форме подхватывать опрделённое поле нужно указать его элементу класс js-form-ignore
 *  - кнопки находятся внутри .b-form-row>.b-sbutton-set, .b-form-input-h>.b-sbutton-set
 *  - любой элемент с классом js-form-button считается кнопкой
 *  - чтобы запретить форме подхватывать опрделённую кнопку нужно указать её элементу класс js-form-ignore-button
 *
 * Маркеры для элементов внутри формы:
 * js-form-include - сделать элемент полем формы
 * js-form-ignore - не рассматривать указанный элемент и его дочерние как поля формы
 * js-form-button - рассматривать элемент как кнопку формы
 * js-form-ignore-button - не рассматривать элемент как кнопку формы
 * js-form-hide-on-update - скрывать элементы при первом изменении формы
 * js-form-changed - элемент появляется только если форма не в начальном состоянии
 * js-form-reset - сбросить значения формы при клике по этому элементу
 * js-form-hide-msg - скрыть замещающее форму сообщение при клике по элементу
 * js-form-ignore-unsaved-changes - после клике по этому элементу проверка на наличие несохранённых изменений отключается
 *
 * @extends {croc.ui.Container}
 * @mixes {croc.ui.form.validation.MStandardValidatable}
 * @implements {croc.ui.form.validation.IValidatable}
 * @event removeField (field: {croc.ui.form.field.IField})
 * @event submit (e, value: Object.<string, *>) валидация была пройдена, чтобы отменить стандартный сабмит формы, вызовите e.preventDefault()
 * @event submitServerError (error: {string})
 * @event activate (field: {croc.ui.form.field.IField}) активация формы (первое взаимодействие с одним из полей формы)
 * @event initState возбуждается после инициализации состояния (_initSate), а также после каждого ресета
 * @event submitSuccessful (response: Object, staticSubmit: {bool}) отправка удачна и response.errcode === 0
 * @event submitValidationFail
 * @event presubmit (prevent: {function})
 * @event postsubmit
 */
croc.ui.form.Form = croc.extend(croc.ui.Container, {
    
    DEFAULT_ANIMATION_TIME: 200,
    
    __LABEL_SIZE: {
        1: 10,
        2: 9,
        3: 8,
        4: 7,
        5: 4
    },
    
    __TEMPLATE_FORM: [
        '<form action="{action}" class="b-form{cls}" method="post">',
        '   <fieldset class="b-form-fset">',
        '       {items:fields}',
        '       <div class="b-form-row g-hidden">',
        '           <div class="b-sbutton-set spacing_1">',
        '               {items:buttons}',
        '           </div>',
        '       </div>',
        '   </fieldset>',
        '   {message}',
        '</form>'
    ].join(''),
    
    __TEMPLATE_FORM_CHECKBOX: [
        '<div class="b-form-check size_{size}">',
        '   <label class="g-ui cursor_pointer">{item} {label}</label>',
        '</div>'
    ].join(''),
    
    __TEMPLATE_FORM_MESSAGE: '<div class="b-form-replacing-message" style="display: none"></div>',
    
    __TEMPLATE_FORM_ROW: [
        '<div class="b-form-row pos_{pos} {margin} js-wrapper">',
        '   {label}',
        '   <div class="b-form-input pos_{pos}">',
        '       <div class="b-form-input-h">{item}</div>',
        '       {hint}',
        '   </div>',
        '</div>'
    ].join(''),
    
    __TEMPLATE_FORM_ROW_HINT: '<div class="b-form-hint pos_bot g-font size_{size} {state}">{hint}</div>',
    
    __TEMPLATE_FORM_ROW_LABEL: [
        '<div class="b-form-label for_input pos_{pos} size_{size}">',
        '   <label for="{id}" class="g-font size_{labelSize}">{label}</label>',
        '   {hint}',
        '</div>'
    ].join(''),
    
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
     * Важно! resolve вызывается с двумя параметрами - error, response.
     * В случае если с сервера пришла ошибка (errcode !== 0), error - текст ошибки. Если
     * ошибка произошла при отправке запроса, то вызывается reject с объектом XHR. Если ошибок не было, то вызывается
     * resolve только со вторым параметром (если response есть) или без параметров.
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
     * {code: message, code2: {field: 'fieldId', message: 'message'}}
     * @type {Object}
     */
    errorCodes: null,
    
    /**
     * Ошибки валидации полей, которые следует установить при их полявлении
     * @type {Object.<string, string>}
     */
    fieldsInvalidMessages: null,
    
    /**
     * Значения, которые следует установить полям при их добавлении
     * @type {Object.<string, *>}
     */
    fieldsValues: null,
    
    /**
     * размер подсказки
     * @type {number}
     */
    hintSize: 12,
    
    /**
     * Конфигурация по-умолчанию добавляемая к items
     * @type {Object.<string, object>|object}
     */
    itemDefaults: {
        buttons: {
            xtype: croc.ui.form.Button
        }
    },
    
    /**
     * Конфигурация добавляемых лэйблов
     * @type {object}
     */
    labelsConf: {
        
        /**
         * размер подсказки
         * @type {number}
         */
        hintSize: 12,
        
        /**
         * размер лэйблов (1-10)
         * @type {number}
         */
        size: null,
        
        /**
         * положение лэйблов
         * @type {string}
         */
        pos: 'top'
    },
    
    /**
     * Объект уведомлений
     * @type {object}
     */
    notifier: null,
    
    /**
     * Предотвратить отправку формы на сервер
     * @type {boolean}
     */
    preventSubmit: false,
    
    /**
     * Способ появления замещающего сообщения: fadeForm|fadeMessage
     * @type {string}
     */
    replacingMessageAnimation: 'fadeForm',
    
    /**
     * Функция получения значений перед отправкой данных на сервер
     * @type {function():Object}
     */
    submitValuesFn: null,
    
    /**
     * Конфигурация для менеджера состояний
     * @type {Object}
     */
    stateManager: null,
    
    /**
     * Статус формы: normal, sentSuccess, sentFailure
     * @type {string}
     */
    status: 'normal',
    
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
     * Опции устанавливающие особенности валидации формы {@see croc.ui.form.validation.Controller#validationBehavior}
     * @type {Object}
     */
    validationBehavior: null,
    
    /**
     * Предупреждать пользователя о несохранённых изменениях
     * @type {boolean}
     */
    warnUnsavedChanges: false,
    
    /**
     * Игнорировать определённые поля, предупреждая о несохранённых изменениях
     * @type {Array.<string>}
     */
    warnUnsavedChangesIgnoreFields: null,
    
    /**
     * Если true, то состояние формы на момент конструирования не считается начальным. Первое начальное состояние
     * сохраняется по вызову {@link #_initState}
     * @type {boolean}
     */
    _partialInitialState: false,
    
    //properties
    /**
     * Идёт ли отправка данных в данный момент
     * @returns {boolean}
     */
    getSubmitting: function() {
        return this.__submitting || false;
    },
    
    /**
     * @param {boolean} value
     */
    __setSubmitting: function(value) {
        if (value !== this.__submitting) {
            var oldValue = this.__submitting;
            this.__submitting = value;
            this.fireEvent('changeSubmitting', value, oldValue);
        }
    },
    
    /**
     * Предупреждать пользователя о несохранённых изменениях
     * @returns {boolean}
     */
    getWarnUnsavedChanges: function() {
        return this.warnUnsavedChanges;
    },
    
    /**
     * Предупреждать пользователя о несохранённых изменениях
     * @param {boolean} value
     */
    setWarnUnsavedChanges: function(value) {
        this.warnUnsavedChanges = value;
    },
    //
    
    init: function() {
        this.__activateDisposer = new croc.util.Disposer();
        croc.ui.form.Form.superclass.init.call(this);
    },
    
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
     * Блокировка всех полей и кнопок формы
     */
    disable: function() {
        if (this.__disabled) {
            return;
        }
        
        this.__alreadyDisabled = {};
        this.getItems().concat(this.getItems('buttons')).forEach(function(widget) {
            if (croc.Interface.check(widget, 'croc.ui.form.field.IDisable') ||
                croc.Class.check(widget, 'croc.ui.form.Button')) {
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
        this.__disabled = true;
    },
    
    /**
     * Очистка объекта (удаление самого DOM-элемента this.el не происходит, удаляются другие элементы вставленные в DOM,
     * а также любые другие данные созданные виджетом)
     */
    dispose: function() {
        croc.ui.form.Form.superclass.dispose.apply(this, arguments);
        this.__notifier.dispose();
    },
    
    /**
     * Разблокировка формы
     */
    enable: function() {
        if (!this.__disabled) {
            return;
        }
        
        this.getItems().concat(this.getItems('buttons')).forEach(function(widget) {
            if (croc.Interface.check(widget, 'croc.ui.form.field.IDisable') ||
                croc.Class.check(widget, 'croc.ui.form.Button')) {
                if (!this.__alreadyDisabled[widget.getUniqueId()]) {
                    widget.setDisabled(false);
                }
            }
        }, this);
        
        this.getElement().add(this.__disabledLinks).removeClass('state_disabled');
        this.__disabled = false;
    },
    
    /**
     * Заблокирована ли форма
     * @returns {boolean}
     */
    getDisabled: function() {
        return this.__disabled;
    },
    
    /**
     * Сообщение заменяющее форму
     * @returns {jQuery}
     */
    getMessageElement: function() {
        return this.__messageEl;
    },
    
    /**
     * Объект уведомлений
     * @return {croc.ui.form.validation.Notifier}
     */
    getNotifier: function() {
        return this.__notifier;
    },
    
    /**
     * @returns {croc.ui.form.StateManager}
     */
    getStateManager: function() {
        return this.__stateManager;
    },
    
    /**
     * Статус формы (см. {@link #status})
     * @returns {status}
     */
    getStatus: function() {
        return this.status;
    },
    
    /**
     * Возвращает первую кнопку типа submit
     * @return {croc.ui.form.Button}
     */
    getSubmitButton: function() {
        return this.__sumbitButton;
    },
    
    /**
     * Менеджер валидации
     * @return {croc.ui.form.validation.Manager}
     */
    getValidationManager: function() {
        return this.__validationManager;
    },
    
    /**
     * Получить значения полей формы в виде объекта.
     * Алиас к {@link #getValues} для поддержки интерфейса {@link croc.ui.form.validation.IValidatable}.
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
     * Скрыть замещающее форму сообщение
     */
    hideReplacingMessage: function() {
        if (this.replacingMessageAnimation === 'fadeForm') {
            this.__messageEl.hide();
            this.__fieldSet.fadeIn(this.DEFAULT_ANIMATION_TIME);
        }
        else if (this.replacingMessageAnimation === 'fadeMessage') {
            this.__messageEl.fadeOut(this.DEFAULT_ANIMATION_TIME);
        }
        else {
            this.__messageEl.hide();
            this.__fieldSet.show();
        }
    },
    
    /**
     * Отключить повторную валидацию поля при потере фокуса
     * @param {croc.ui.form.field.IField} field
     */
    offFieldRevalidating: function(field) {
        this.__validationController.offFieldRevalidating(field);
    },
    
    /**
     * Сбросить значения и состояния полей
     */
    reset: function() {
        var $this = this;
        this.__validationManager.resetValidation();
        this.__stateManager.reset();
        
        if (!this.__activateDisposer) {
            this.__activateDisposer = new croc.util.Disposer();
            $.each(this.getItems(), function(i, field) {
                $this.__setUpFieldActivation(field);
            });
        }
        
        this.fireEvent('initState');
    },
    
    /**
     * Изменить время задержки до отправки запроса
     * @param {number} delay
     */
    setAjaxSubmitDelay: function(delay) {
        this.__submitController.setAjaxSubmitDelay(delay);
    },
    
    /**
     * Явно назначить кнопку отправки формы
     * @param {croc.ui.form.Button} button
     */
    setSubmitButton: function(button) {
        this.__sumbitButton = button;
        button.on('execute', function() {
            this.submit();
        }, this);
    },
    
    /**
     * Сменить пояснение под лэйблом поля. Если hint === null то пояснение удаляется.
     * @param {croc.ui.form.field.IField|string} field
     * @param {string} [hint=null]
     * @param {string} [size=null]
     * @param {string} [state=null]
     */
    setFieldHint: function(field, hint, size, state) {
        if (typeof field === 'string') {
            field = /** @type {croc.ui.form.field.IField} */(this.getItem(field));
        }
        var input = field.getElement().closest('.b-form-input');
        input.find('>.b-form-hint').remove();
        if (hint) {
            input.append(this.__TEMPLATE_FORM_ROW_HINT.render({
                hint: hint,
                size: size || this.hintSize,
                state: state ? 'state_' + state : ''
            }));
        }
    },
    
    /**
     * Показать замещающее форму сообщение
     * @param {string} [message=null]
     */
    showReplacingMessage: function(message) {
        var $this = this;
        
        if (!this.__messageEl.length) {
            this.__messageEl = $(this.__TEMPLATE_FORM_MESSAGE).appendTo(this.getElement());
        }
        
        if (message) {
            this.__messageEl.html(message);
        }
        
        if (this.replacingMessageAnimation === 'fadeForm') {
            return this.__fieldSet.fadeOut(this.DEFAULT_ANIMATION_TIME, function() {
                $this.__messageEl.show();
            }).promise();
        }
        else if (this.replacingMessageAnimation === 'fadeMessage') {
            return this.__messageEl.fadeIn(this.DEFAULT_ANIMATION_TIME).promise();
        }
        else {
            this.__messageEl.show();
            this.__fieldSet.hide();
            return $.Deferred().resolve();
        }
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
     * @param {string|croc.ui.form.field.IField} field
     * @param {boolean} available
     * @param {boolean|string} [setDisableOrSelector=false] если true, то делает поле недоступным не скрывая его,
     * если строка, то скрывает поле вплоть до родителя подходящего под переданный селектор
     * @param {string|function(jQuery, boolean)} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
     */
    toggleField: function(field, available, setDisableOrSelector, toggleMethod) {
        if (typeof field === 'string') {
            field = /** @type {croc.ui.form.field.IField} */(this.getItem(field));
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
     * Дополнительные данные для рендеринга из шаблона
     * @returns {object}
     * @protected
     */
    _getAddRenderData: function() {
        return {
            action: this.action,
            message: this.__TEMPLATE_FORM_MESSAGE
        };
    },
    
    /**
     * Значения для отправки на сервер аяксом
     * @returns {Object}
     * @protected
     */
    _getAjaxSubmitValues: function() {
        return this.getValues();
    },
    
    /**
     * Возвращает конфигурация виджета по его элементу. Конфигурация как минимум должна содержать xtype.
     * @param {string} section
     * @param {jQuery} element
     * @return {object}
     * @protected
     */
    _getConfByElement: function(section, element) {
        var conf = {xtype: null};
        if (section === 'buttons') {
            conf.xtype = croc.ui.form.Button;
        }
        else if (element.is('input[type=hidden]')) {
            conf.xtype = croc.ui.form.field.Hidden;
        }
        
        return conf;
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
     * Шаблон для обрамления дочернего элемента. Должен присутствовать маркер {item}.
     * @param {string} section
     * @param {croc.ui.Widget} item дочерний виджет
     * @returns {string}
     * @protected
     */
    _getItemWrapperTemplate: function(section, item) {
        var field = /** @type {croc.ui.form.field.IField} */(item);
        var meta = item.getMeta();
        
        if (section !== 'fields') {
            return croc.ui.form.Form.superclass._getItemWrapperTemplate.apply(this, arguments);
        }
        
        var fieldSize = croc.Interface.check(field, 'croc.ui.form.field.ISizable') ? field.getSize() : '1';
        
        var label = '';
        var hint = '';
        var defaultLabelConf = croc.ui.form.Form.prototype.labelsConf;
        var labelPos = meta.labelPos || this.labelsConf.pos || defaultLabelConf.pos;
        var rowMargin = meta.rowMargin ? 'margin_' + meta.rowMargin : '';
        
        if (croc.Class.check(field, 'croc.ui.form.field.CheckBox')) {
            return this.__TEMPLATE_FORM_ROW.render({
                label: '',
                hint: '',
                pos: labelPos,
                margin: rowMargin,
                item: this.__TEMPLATE_FORM_CHECKBOX.render({
                    label: meta.label || '',
                    size: field.getSize()
                })
            });
        }
        
        if (meta.label) {
            var labelHint = '';
            if (meta.labelHint) {
                labelHint = this.__TEMPLATE_FORM_ROW_HINT.render({
                    hint: meta.labelHint,
                    size: meta.labelHintSize || this.labelsConf.hintSize || defaultLabelConf.hintSize,
                    state: ''
                });
            }
            
            label = this.__TEMPLATE_FORM_ROW_LABEL.render({
                size: fieldSize,
                labelSize: meta.labelSize || this.labelsConf.size || this.__LABEL_SIZE[fieldSize],
                pos: meta.labelPos || this.labelsConf.pos || defaultLabelConf.pos,
                label: meta.label,
                id: croc.Interface.check(field, 'croc.ui.form.field.IHtmlControl') ?
                    croc.ui.form.Helper.getFieldId(field, meta.id) : '',
                hint: labelHint
            });
        }
        else if (meta.id && croc.Interface.check(field, 'croc.ui.form.field.IHtmlControl')) {
            croc.ui.form.Helper.setFieldId(field, meta.id);
        }
        
        if (meta.hint) {
            hint = this.__TEMPLATE_FORM_ROW_HINT.render({
                hint: meta.hint,
                size: meta.hintSize || this.hintSize,
                state: meta.hintState ? 'state_' + meta.hintState : ''
            });
        }
        
        return this.__TEMPLATE_FORM_ROW.render({
            label: label,
            hint: hint,
            margin: rowMargin,
            pos: labelPos
        });
    },
    
    /**
     * Шаблон для элемента
     * @param {Object} options
     * @return {$.Deferred|string}
     * @protected
     */
    _getTemplate: function(options) {
        return options.htmlTemplate || this.__TEMPLATE_FORM;
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
     * Вставить дочерний элемент в определённую секцию
     * @param {string} section
     * @param {jQuery} elements
     * @param {jQuery} beforeElement
     * @param {Array.<croc.ui.Widget>} widgets
     * @protected
     */
    _insertItems: function(section, elements, beforeElement, widgets) {
        if (section === 'fields') {
            if (widgets.some(function(x) { return croc.Class.check(x, 'croc.ui.form.field.Hidden'); })) {
                if (!widgets.every(function(x) { return croc.Class.check(x, 'croc.ui.form.field.Hidden'); })) {
                    throw new Error('Нельзя вставлять в форму одновременно и скрытые поля и обычные.');
                }
                this.getElement().prepend(elements);
            }
            else if (beforeElement) {
                beforeElement.closest('.b-form-row').before(elements);
            }
            else if (this.__buttonsRow.length) {
                this.__buttonsRow.before(elements);
            }
            else {
                this.__fieldSet.last().append(elements);
            }
        }
        else if (section === 'buttons') {
            if (beforeElement) {
                beforeElement.closest('.b-sbutton').before(elements);
            }
            else {
                this.__buttonsContainer.append(elements);
            }
            
            this.__buttonsRow.removeClass('g-hidden');
        }
    },
    
    /**
     * Метод вызывается при добавлении нового дочернего элемента
     * @param {string} section
     * @param {croc.ui.Widget} item
     * @protected
     */
    _onAddItem: function(section, item) {
        if (section === 'buttons' && !this.__sumbitButton && item.getType() === 'submit') {
            /**
             * @type {croc.ui.form.Button}
             * @private
             */
            this.__sumbitButton = item;
        }
        
        if (section !== 'fields') {
            return;
        }
        
        var field = /** @type {croc.ui.form.field.IField} */(item);
        var meta = item.getMeta();
        
        this.__stateManager.addItem(field, {dontReset: field.getMeta().dontReset});
        
        //activation
        this.__setUpFieldActivation(field);
        
        //initial value
        var initialValue = this.fieldsValues && this.fieldsValues[field.getIdentifier()];
        if (initialValue) {
            var initValue = function() {
                field.setValue(initialValue);
                delete this.fieldsValues[field.getIdentifier()];
            }.bind(this);
            initValue();
            //если значения будут перекрыты браузером
            this._getDisposer().setTimeout(initValue, 100);
        }
        
        if (meta.setDefaults) {
            (Array.isArray(meta.setDefaults) ? meta.setDefaults : [meta.setDefaults])
                .forEach(function(type) {
                    croc.ui.form.Form.setFieldDefaults(type, field);
                });
        }
    },
    
    /**
     * Метод вызывается при удалении дочернего виджета
     * @param {croc.ui.Widget} item
     * @protected
     */
    _onRemoveItem: function(item) {
        if (this.__sumbitButton === item) {
            this.__sumbitButton = null;
        }
        
        if (item.getParentSection() !== 'fields') {
            return;
        }
        
        var field = /** @type {croc.ui.form.field.IField} */(item);
        this.__stateManager.removeItem(field);
        
        //activation
        if (this.__activateDisposer) {
            this.__activateDisposer.removeObject(field);
        }
        
        this.fireEvent('removeField', field);
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
     * Удалить дочерний элемент
     * @param {croc.ui.Widget} item
     * @protected
     */
    _removeItemElement: function(item) {
        if (item.getParentSection() === 'buttons') {
            item.getElement().remove();
        }
        else {
            var fieldWrapper = croc.ui.form.Form.getFieldWrapper(item);
            if (fieldWrapper.length) {
                fieldWrapper.remove();
            }
            else {
                item.getElement().remove();
            }
        }
        
        if (item.getParentSection() === 'buttons' && this.getItems('buttons').length === 0) {
            this.__buttonsRow.addClass('g-hidden');
        }
    },
    
    /**
     * Поиск элементов DOM для всех дочерних элементов
     * @param {jQuery} el
     * @return {Object.<string, jQuery>}
     * @protected
     */
    _scanForItemsElements: function(el) {
        return {
            fields: croc.ui.form.Form.findFieldsElements(el),
            buttons: el.find('.b-form-row>.b-sbutton-set .b-sbutton,' +
            '.b-form-input-h>.b-sbutton-set .b-sbutton,' +
            '.b-form-foot-cell>.b-sbutton,' +
            '.js-form-button').filter(':not(.js-form-ignore-button)')
        };
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
     */
    __idFieldsLabels: function() {
        $.each(this.getItems('fields'), function(i, field) {
            if (croc.Interface.check(field, 'croc.ui.form.field.IHtmlControl')) {
                var label = croc.ui.form.Form.getFieldLabel(field);
                if (label.length && !label.attr('for')) {
                    label.attr('for', croc.ui.form.Helper.getFieldId(field));
                }
            }
        });
        
        this.getElement().find('[data-form-label-for]')
            .each(function(i, labelEl) {
                labelEl = $(labelEl);
                var identifier = labelEl.data('formLabelFor');
                var field = this.getItem(identifier);
                if (field && croc.Interface.check(field, 'croc.ui.form.field.IHtmlControl')) {
                    labelEl.attr('for', croc.ui.form.Helper.getFieldId(field));
                }
            }.bind(this));
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
                $.proxy(this.__activateForm, this, field));
        }
    },
    
    /**
     * @private
     */
    __setUpJsMarkers: function() {
        //ignore unsaved changes
        this.getElement().on('click', '.js-form-ignore-unsaved-changes', function() {
            this.setWarnUnsavedChanges(false);
        }.bind(this));
        
        //hide on update
        var hideOnUpdateMessages = this.getElement().find('.js-form-hide-on-update');
        if (hideOnUpdateMessages.length > 0) {
            this.__stateManager.once('updateStateChanged', function() {
                hideOnUpdateMessages.slideUp();
            });
        }
        
        //changed
        var changedMessage = this.getElement().find('.js-form-changed');
        if (changedMessage) {
            this.__stateManager.on('updateStateChanged', function(value) {
                changedMessage.toggle(value);
            });
        }
        
        //cancel
        this.getElement().on('click', '.js-form-reset', function() {
            if (!this.__submitController.isSubmitBlocked()) {
                this.reset();
            }
        }.bind(this));
        
        //hide replacing message
        this.getElement().on('click', '.js-form-hide-msg', function() {
            this.hideReplacingMessage();
        }.bind(this));
    },
    
    /**
     * @param {string|croc.ui.form.field.IField} field
     * @param {boolean} available
     * @param {string} selector
     * @param {string|Function} [toggleMethod=null] null|fade|slide - метод анимации появления/скрытия поля
     * @private
     */
    __toggleFieldVisibility: function(field, available, selector, toggleMethod) {
        var el = selector ? field.getElement().closest(selector) : croc.ui.form.Form.getFieldWrapper(field);
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
});

croc.mix(croc.ui.form.Form, croc.ui.form.validation.MStandardValidatable);

_.assign(croc.ui.form.Form, {
    /**
     * Ищет элементы полей формы внутри переданного элемента
     * @param {jQuery} el
     * @returns {jQuery}
     */
    findFieldsElements: function(el) {
        return el.find(
            '.b-form-input-h:not(.js-form-ignore)>*:not(.b-sbutton-set,.b-form-check,.b-form-complex),' +
            '.js-form-include,' +
            '.b-form-input-h>.b-form-check .b-input-checkbox,' +
            '>input[type=hidden]').filter(':not(.js-form-ignore,.js-form-button)');
    },
    
    /**
     * @param {croc.ui.form.field.IField|jQuery} field
     * @returns {jQuery}
     * todo сделать определения и по id
     */
    getFieldLabel: function(field) {
        return croc.ui.form.Form.getFieldWrapper(field).find('.b-form-label label');
    },
    
    /**
     * Возвращает обрамляющий поле элемент
     * @param {croc.ui.form.field.IField|jQuery} field
     * @returns {jQuery}
     */
    getFieldWrapper: function(field) {
        if (!(field instanceof jQuery)) {
            field = field.getElement();
        }
        return field.closest('.b-form-row,.b-form-complex-cell');
    },
    
    /**
     * Назначить состояние по-умолчанию для поля (например, взять его из Stm.env)
     * todo перенести в helper
     * @param {string} fieldType 'userLocation'|'userName'|'userEmail'|'userPhone'|'userPhoneCountry'|'productName'
     * @param {croc.ui.form.field.IField} field
     */
    setFieldDefaults: function(fieldType, field) {
        var parentForm = field.getParentWidget();
        if (!field.isEmpty() ||
            (fieldType !== 'userPhoneCountry' && parentForm &&
            parentForm instanceof croc.ui.form.Form && parentForm.getStatus() !== 'normal')) {
            return;
        }
        
        //noinspection FallthroughInSwitchStatementJS
        switch (fieldType) {
            case 'userLocation':
                var location = croc.utils.objAccess('Stm.env.location');
                if (location &&
                        //указан определённый пункт, а не 1-0-0-0-0 (Россия)
                    parseInt(location.code.split('-').slice(1).join(''), 10) !== 0) {
                    
                    field.setValue({
                        value: location.code,
                        text: [location.country, location.region, location.city]
                            .filter(function(x) { return !!x; })
                            .join(', '),
                        hasMetro: !!location.hasMetro
                    });
                }
                break;
            
            case 'userName':
                var user = croc.utils.objAccess('Stm.env.user');
                if (!user) {
                    break;
                }
                
                var name = [user.lastname, user.firstname, user.patronymic]
                    .filter(function(x) { return !!x; })
                    .join(' ');
                
                if (name) {
                    field.setValue(name);
                }
                break;
            
            case 'userEmail':
            case 'userPhone':
            case 'productName':
                //userPhone -> user.phone
                var accessor = 'Stm.env.' + fieldType.replace(/[A-Z]/g, function(x) { return '.' + x.toLowerCase(); });
                var value = croc.utils.objAccess(accessor);
                if (value) {
                    field.setValue(value);
                }
                break;
            
            case 'userPhoneCountry':
                var locationCode = croc.utils.objAccess('Stm.env.location.code');
                if (locationCode) {
                    field.setCountry(locationCode.split('-')[0]);
                }
                break;
            
            default:
                throw new Error('Неизвестный тип поля: ' + fieldType);
        }
    }
});

croc.ui.WidgetsManager.getInstance().registerAlias(croc.ui.form.Form, 'croc.ui.form.Form');