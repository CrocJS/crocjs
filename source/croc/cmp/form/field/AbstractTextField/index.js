/**
 * api-ru Абстракция над полем ввода (text/textarea)
 * api-en Abstraction above the text field (text/textarea).
 * todo implement composite placeholder
 */
croc.Class.define('croc.cmp.form.field.AbstractTextField', {
    type: 'abstract',
    extend: croc.cmp.form.field.AbstractHtmlControl,
    
    implement: [
        croc.cmp.form.field.ISizable,
        croc.cmp.form.field.IUpdatableField,
        croc.cmp.form.field.ITextField
    ],
    
    statics: {
        /**
         * @private
         * @static
         */
        __LISTEN_VALUE_CHANGE_INTERVAL: 10
    },
    
    properties: {
        action: {
            model: true
        },
        
        /**
         * api-ru Выравнивание текста
         * api-en Text alignment.
         * @type {string}
         */
        align: {
            check: ['left', 'right', 'center'],
            model: true
        },
        
        /**
         * css class type_... for root DOM-element
         * @type {string}
         */
        cssType: {
            required: true
        },
        
        defaultAction: {
            value: null,
            option: true
        },
        
        /**
         * api-ru Мгновенное значение текстового поля
         * api-en Instant value of text field.
         * @type {string}
         */
        instantValue: {
            type: 'string',
            model: true
        },
        
        /**
         * api-ru плэйсхолдер для поля
         * api-en Placeholder for field.
         * @type {string}
         */
        placeholder: {
            type: 'string',
            model: true
        },
        
        /**
         * api-ru Пометить поле как "только для чтения"
         * api-en Mark the field as "only for reading".
         * @type {boolean}
         */
        readOnly: {
            model: true
        },
        
        /**
         * api-ru Функция трансформации значения поля после его смены
         * api-en Transformation function of field value after its change. 
         * @type {function(*):*}
         */
        transformOnChange: {
            type: 'function',
            model: true
        },
        
        /**
         * api-ru Транформация значения каждый update поля
         * api-en Value transformation of every update field.
         * @type {function(string):string}
         */
        transformOnUpdate: {
            type: 'function',
            model: true
        },
        
        /**
         * @type {string}
         */
        value: {
            value: '',
            __setter: null,
            model: true
        }
    },
    
    options: {
        /**
         * api-ru Указывает как следует реагировать при изменении внутреннего значения поля извне (в обход API TextField).
         *        Возможные значения: null - нет реакции, 'change' - изменить внешнее значение, 'update' - вызывать событие update
         * api-en Shows how should react to change of field internal value from the outside (by pass API TextField).
         *        Possible values: null - no reaction, 'change' - change external value, 'update' - call update event.
         * @type {String}
         */
        externalChangeReaction: {
            check: ['change', 'update']
        },
        
        /**
         * api-ru Максимальное кол-во знаков (аттрибут maxlength)
         *        Если указаны правила валидации length или lengthRange, то определяется автоматически
         * api-en Maximum number of characters (attribute maxlength).
         *        It will automaticaly determines if length or lenthRange rule is set
         * @type {number}
         */
        maxLength: {
            type: 'number'
        },
        
        /**
         * api-ru На мобильных устройствах прокручивать страницу так, чтобы поле оказалось наверху, когда оно в фокусе
         * api-en On mobile devices scroll the page so that the field turns out above, when it is in focus.
         * @type {boolean}
         */
        mobileScrollTop: {},
        
        /**
         * api-ru Функция очистки поля (по нажатию на кнопку reset)
         * api-en Function of field clean up (by cliking on reset button).
         * @type {function(croc.ui.form.field.AbstractTextField)}
         */
        resetFn: function(field) {
            field.setValue('');
        },
        
        /**
         * api-ru Особенности выделения текста внутри поля
         * api-ru smartSelectOnClick - если текст выделен полностью, то клик приведёт к сбросу выделения, иначе текст выделяется полностью
         * api-ru selectOnFocus - текст выделяется только при фокусе элемента
         * api-en Features of highlighting the text inside field. 
         * api-en smartSelectOnClick - if text is highlighted completely, then click lead to the reset of highlighting, otherwise text is highlighted completely.
         * api-en selectOnFocus - text is highlighted only in focus of element.
         * @type {string}
         */
        selectionBehavior: {
            check: ['smartSelectOnClick', 'selectOnFocus']
        },
        
        /**
         * api-ru Показывать ли экшен у поля
         * api-en Does field action needs to be shown.
         * @type {Boolean}
         */
        showAction: true,
        
        /**
         * api-ru Показывать ли крестик для сброса значения поля или нет
         * api-en Does reset icon needs to be shown?
         * @type {Boolean}
         */
        showReset: true,
        
        /**
         * Field size
         * @type {string}
         */
        size: {
            check: ['1', '2', '3', '4', '5'],
            value: '1'
        },
        
        /**
         * api-ru Использовать проверку изменения значения по событию blur, вместо change
         * api-en Use check of value changes on blur event, instead change.
         * @type {boolean}
         */
        _checkValueOnBlur: true
    },
    
    members: {
        /**
         * @returns {jQuery}
         */
        getFieldContainer: function() {
            return $(this.fieldContainerElement);
        },
        
        /**
         * Field size
         * @returns {string}
         */
        getSize: function() {
            return this._options.size;
        },
        
        /**
         * api-ru Пробелы на концах значения являются важными и их нельзя обрезать
         * api-en Spaces on the end of the value are important and they can't be cut out.
         * @returns {boolean}
         */
        keepWhiteSpace: function() {
            return false;
        },
        
        /**
         * api-ru Передвинуть каретку в конец поля
         * api-en Move cursor to the end of field.
         */
        moveCursorToEnd: function() {
            croc.utils.domSetCaretPos(this.getFieldElement(), this.getFieldElement().val().length);
        },
        
        reset: function() {
            this._options.resetFn(this);
        },
        
        resetAction: function() {
            this.setAction(this.getDefaultAction());
        },
        
        select: function() {
            var fieldElement = this.getFieldElement();
            if (fieldElement) {
                fieldElement.select();
                fieldElement.focus();
            }
        },
        
        setValue: function(value, internal) {
            if (internal && internal.internal && this._options.transformOnChangeFunc) {
                value = this._options.transformOnChangeFunc(value);
            }
            value = value || '';
            if (value === this.getValue()) {
                this.setInstantValue(value, internal);
            }
            else {
                this.__setValue(value, internal);
            }
        },
        
        /**
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.AbstractTextField.superclass._initModel.apply(this, arguments);
            if (this.getInstantValue()) {
                this.setValue(this.getInstantValue());
            }
            else if (this._options.value === undefined || this._options.value === null) {
                this.setValue('');
            }
            this.listenProperty('value', function(value, old, internal) {
                this.setInstantValue(value, internal);
            }, this);
            
            var validation = this._options.validation;
            if (!this._options.maxLength && validation) {
                var length = validation.length || (validation.lengthRange && validation.lengthRange[1]);
                if (length) {
                    this._options.maxLength = length;
                }
            }
        },
        
        /**
         * api-ru Инициализация виджета после его отрисовки в DOM
         * api-en Initialization of widget after its rendering in DOM.
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.field.AbstractTextField.superclass._initWidget.apply(this, arguments);
            
            this._model.start('transformOnChangeFunc', 'transformOnChange', function(value) {
                return croc.cmp.form.field.Transform.createTransformFunction(value);
            });
            this._model.start('transformOnUpdateFunc', 'transformOnUpdate', function(value) {
                return croc.cmp.form.field.Transform.createTransformFunction(value);
            });
            
            if (this._options.externalChangeReaction) {
                this._getDisposer().setInterval(function() {
                    if (this._options.externalChangeReaction === 'update') {
                        this.setInstantValue(this._getFieldValue());
                    }
                    else {
                        this.setValue(this._getFieldValue());
                    }
                }.bind(this), croc.cmp.form.field.AbstractTextField.__LISTEN_VALUE_CHANGE_INTERVAL);
            }
        }
    }
});
