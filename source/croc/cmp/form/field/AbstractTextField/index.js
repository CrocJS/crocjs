/**
 * Абстракция над полем ввода (text/textarea)
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
            check: ['loader', 'unfold'],
            model: true
        },
        
        /**
         * Выравнивание текста
         * @type {string}
         */
        align: {
            check: ['left', 'right', 'center'],
            model: true
        },
        
        /**
         * Мгновенное значение текстового поля
         * @type {string}
         */
        instantValue: {
            type: 'string',
            model: true
        },
        
        /**
         * плэйсхолдер для поля
         * @type {string}
         */
        placeholder: {
            type: 'string',
            model: true
        },
        
        /**
         * Пометить поле как "только для чтения"
         * @type {boolean}
         */
        readOnly: {
            model: true
        },
        
        /**
         * Размер поля
         * @type {string}
         */
        size: {
            type: 'string',
            __setter: null,
            value: '1',
            model: true
        },
        
        /**
         * Функция трансформации значения поля после его смены
         * @type {function(*):*}
         */
        transformOnChange: {
            type: 'function',
            model: true
        },
        
        /**
         * Транформация значения каждый update поля
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
         * Указывает как следует реагировать при изменении внутреннего значения поля извне (в обход API TextField).
         * Возможные значения: null - нет реакции, 'change' - изменить внешнее значение, 'update' - вызывать событие update
         * @type {String}
         */
        externalChangeReaction: {
            check: ['change', 'update']
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
         * На мобильных устройствах прокручивать страницу так, чтобы поле оказалось наверху, когда оно в фокусе
         * @type {boolean}
         */
        mobileScrollTop: {},
        
        /**
         * Функция очистки поля (по нажатию на кнопку reset)
         * @type {function(croc.ui.form.field.AbstractTextField)}
         */
        resetFn: function(field) {
            field.setValue('');
        },
        
        /**
         * Особенности выделения текста внутри поля
         * smartSelectOnClick - если текст выделен полностью, то клик приведёт к сбросу выделения, иначе текст выделяется
         * полностью
         * selectOnFocus - текст выделяется только при фокусе элемента
         * @type {string}
         */
        selectionBehavior: {
            check: ['smartSelectOnClick', 'selectOnFocus']
        },
        
        /**
         * Показывать ли экшен у поля
         * @type {Boolean}
         */
        showAction: true,
        
        /**
         * Показывать ли крестик для сброса значения поля или нет
         * @type {Boolean}
         */
        showReset: true,
        
        /**
         * Использовать проверку изменения значения по событию blur, вместо change
         * @type {boolean}
         */
        _checkValueOnBlur: true
    },
    
    members: {
        /**
         * Пробелы на концах значения являются важными и их нельзя обрезать
         * @returns {boolean}
         */
        keepWhiteSpace: function() {
            return false;
        },
        
        /**
         * Передвинуть каретку в конец поля
         */
        moveCursorToEnd: function() {
            croc.utils.domSetCaretPos(this.getFieldElement(), this.getFieldElement().val().length);
        },
        
        reset: function() {
            this._options.resetFn(this);
        },
        
        select: function() {
            var fieldElement = this.getFieldElement();
            if (fieldElement) {
                fieldElement.select();
                fieldElement.focus();
            }
        },
        
        setValue: function(value, old, internal) {
            if (internal && this._options.transformOnChangeFunc) {
                value = this._options.transformOnChangeFunc(value);
            }
            if (value === this.getValue()) {
                this.setInstantValue(value);
            }
            else {
                this.__setValue(value);
            }
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.AbstractTextField.superclass._initModel.apply(this, arguments);
            if (this.getInstantValue()) {
                this.setValue(this.getInstantValue());
            }
            croc.data.Helper.bind(this, 'value', this._model, 'instantValue');
            
            var validation = this._options.validation;
            if (!this._options.maxLength && validation) {
                var length = validation.length || (validation.lengthRange && validation.lengthRange[1]);
                if (length) {
                    this._options.maxLength = length;
                }
            }
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
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
