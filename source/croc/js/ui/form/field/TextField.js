/**
 * Абстракция над полем ввода
 */
croc.Class.define('croc.ui.form.field.TextField', {
    extend: croc.ui.form.field.AbstractTextField,
    
    properties: {
        /**
         * Предназначено ли поле для ввода пароля
         * @type {boolean}
         */
        masked: {
            type: 'boolean',
            value: true,
            apply: '__applyMasked',
            option: true
        },
        
        /**
         * Пометить поле как "только для чтения"
         * @type {boolean}
         */
        readOnly: {
            type: 'boolean',
            apply: function(value) {
                if (this.getFieldElement()) {
                    this.getFieldElement().prop('readonly', value);
                }
            },
            value: false,
            option: true
        }
    },
    
    options: {
        /**
         * Класс type_... корневого элемента
         * @type {string}
         */
        cssType: 'text',
        
        /**
         * Отключить собственный автокомплит поля. true - при suggestion !== null
         * @type {boolean}
         */
        disableAutocomplete: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Максимальное кол-во знаков (аттрибут maxlength)
         * Если указаны правила валидации length или lengthRange, то определяется автоматически
         * @type {number}
         */
        maxLength: {
            type: 'number'
        },
        
        /**
         * Предназначено ли поле для ввода пароля
         * @type {boolean}
         */
        password: {
            type: 'boolean',
            value: false
        },
        
        /**
         * если передана строка то интерпретируется как url контроллера для стандартных подсказок,
         * если передана модель, то создаётся стандартный компонент подсказок с этой моделью,
         * если передано true, то создаётся стандартный компонент подсказок с моделью по-умолчанию,
         * Если передан объект - он интерпретируется как опции компонента suggestion
         * @type {String|croc.data.IObservableList|Array|croc.ui.form.suggestion.Default|Boolean|Object}
         */
        suggestion: null
    },
    
    /**
     * Очистка объекта перед разрушением
     */
    destruct: function() {
        if (this.__suggestion) {
            this.__suggestion.destroy();
        }
    },
    
    members: {
        /**
         * Html-элемент поля
         * @return {jQuery}
         */
        getFieldElement: function() {
            return this.__fieldElement ||
                (this.getElement() && (this.__fieldElement = this.getElement().find('input.b-input-field-h')));
        },
        
        /**
         * @return {croc.ui.form.suggestion.Default}
         */
        getSuggestion: function() {
            return this.__suggestion;
        },
        
        /**
         * Пробелы на концах значения являются важными и их нельзя обрезать
         * @returns {boolean}
         */
        keepWhiteSpace: function() {
            return this.__isPassword || croc.ui.form.field.TextField.superclass.keepWhiteSpace.apply(this, arguments);
        },
        
        /**
         * Передвинуть каретку в конец поля
         */
        moveCursorToEnd: function() {
            croc.utils.domSetCaretPos(this.__visibleFieldElement, this.__visibleFieldElement.val().length);
        },
        
        /**
         * @param {Object} settings
         * @return {croc.ui.form.suggestion.Default}
         * @protected
         */
        _createDefaultSuggestion: function(settings) {
            throw 'not implemented!';
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.form.field.TextField.superclass._getAddRenderData.apply(this, arguments), {
                inputAttrs: '' +
                ' value="' + (options.value ? options.value.replace(/"/g, '\\"') : '') + '"' +
                ' type="' + (options.password && this.getMasked() ? 'password' : 'text') + '"' +
                (this.getReadOnly() ? ' readonly="readonly"' : '') +
                (options.disableAutocomplete ? ' autocomplete="off"' : '') +
                (options.maxLength ? ' maxlength="' + options.maxLength + '"' : ''),
                inputTagEnd: '',
                inputTag: 'input'
            });
        },
        
        /**
         * Возвращает внутреннее (сырое) значение поля
         * @protected
         */
        _getFieldValue: function() {
            var fieldEl = this.getFieldElement();
            return fieldEl && (this.__visibleFieldElement || fieldEl).val();
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            if (this.__isPassword && croc.util.Browser.isIE('<10')) {
                this.getFieldElement();
                var newField = $(this.__fieldElement.prop('outerHTML')
                    .replace(/type\s*=\s*"?\w+"?/i, 'type="' + (this.getMasked() ? 'text' : 'password') + '"'))
                    .removeAttr('name').addClass('g-hidden').insertAfter(this.__fieldElement);
                this.__visibleFieldElement = this.__fieldElement;
                this.__fieldElement = this.__fieldElement.add(newField);
            }
            else {
                this.__visibleFieldElement = this.getFieldElement();
            }
            
            croc.ui.form.field.TextField.superclass._initWidget.call(this);
            
            if (this.__suggestionDesc) {
                if (croc.Class.check(this.__suggestionDesc, 'croc.ui.form.suggestion.Default')) {
                    this.__suggestion = this.__suggestionDesc;
                    this.__suggestion.initField(this);
                }
                else {
                    var suggestionSettings = typeof this.__suggestionDesc === 'string' ? {url: this.__suggestionDesc} :
                        
                        croc.Interface.check(this.__suggestionDesc, 'croc.data.IObservableList') ||
                        Array.isArray(this.__suggestionDesc) ? {model: this.__suggestionDesc} :
                            
                            typeof this.__suggestionDesc === 'object' ? this.__suggestionDesc : {};
                    
                    suggestionSettings.field = this;
                    this.__suggestion = this._createDefaultSuggestion(suggestionSettings);
                }
            }
            
            if (!this.getMasked()) {
                this.__applyMasked(this.getMasked());
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            if (options.suggestion) {
                options.disableAutocomplete = true;
            }
            if (options.readOnly) {
                options.showReset = false;
            }
            
            this.__isPassword = options.password;
            this.__suggestionDesc = options.suggestion;
            
            croc.ui.form.field.TextField.superclass._onPropertiesInitialized.apply(this, arguments);
        },
        
        /**
         * @param value
         * @private
         */
        __applyMasked: function(value) {
            if (this.getElement() && this.__isPassword) {
                if (croc.util.Browser.isIE('<10')) {
                    this.__fieldElement.val(this.getValue() || '');
                    this.__visibleFieldElement = this.__fieldElement
                        .filter('[type=' + (value ? 'password' : 'text') + ']').removeClass('g-hidden');
                    var anotherEl = this.__fieldElement.not(this.__visibleFieldElement).addClass('g-hidden');
                    if (this.getIdentifier()) {
                        this.__visibleFieldElement.attr('name', this.getIdentifier());
                        anotherEl.removeAttr('name');
                    }
                }
                else {
                    this.getFieldElement().attr('type', value ? 'password' : 'text');
                }
            }
        }
    }
});
