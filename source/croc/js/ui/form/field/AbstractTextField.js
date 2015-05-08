/**
 * Абстракция над полем ввода (text/textarea)
 */
croc.Class.define('croc.ui.form.field.AbstractTextField', {
    type: 'abstract',
    extend: croc.ui.form.field.AbstractHtmlControl,
    
    implement: [
        croc.ui.form.field.ISizable,
        croc.ui.form.field.IUpdatableField,
        croc.ui.form.field.ITextField
    ],
    
    include: croc.ui.form.field.MStandardSizable,
    
    statics: {
        /**
         * враппер для ячеек поля
         * @static
         */
        CELL_WRAPPER: '<div class="b-input-cell">{item}</div>',
        
        /**
         * враппер поля для ячеек с кнопкой
         * @static
         */
        CELL_BUTTON_WRAPPER: '<div class="b-input-cell cell_button">{item}</div>',
        
        /**
         * @private
         * @static
         */
        __LISTEN_VALUE_CHANGE_INTERVAL: 10,
        
        /**
         * @private
         * @static
         */
        __TEMPLATE_TEST_ELEMENT: '<div class="b-input-field-h" style="position: absolute; top: 0; left: 0; padding-right: 0; visibility: hidden; width: auto;"></div>'
    },
    
    events: {
        /**
         * @param {string} action
         * @param {string} old
         */
        changeAction: null
    },
    
    properties: {
        /**
         * Выравнивание текста
         * @type {string}
         */
        align: {
            cssClass: true,
            check: ['left', 'right', 'center'],
            option: true
        },
        
        /**
         * @type {string}
         */
        instantValue: {
            field: '__instantValue',
            getter: null,
            __setter: null,
            transform: '_transformInstantValue',
            event: true
        },
        
        /**
         * плэйсхолдер для поля
         * @type {string}
         */
        placeholder: {
            type: 'string',
            event: true,
            option: true
        },
        
        /**
         * Функция трансформации значения поля после его смены
         * @type {function(*):*}
         */
        transformOnChange: {
            type: 'function',
            transform: function(value) {
                return croc.ui.form.field.transform.createTransformFunction(value);
            },
            option: true
        },
        
        /**
         * Транформация значения каждый update поля
         * @type {function(string):string}
         */
        transformOnUpdate: {
            type: 'function',
            transform: function(value) {
                return croc.ui.form.field.transform.createTransformFunction(value);
            },
            option: true
        },
        
        /**
         * @type {string}
         */
        value: {
            type: 'string',
            transform: '_transformValue',
            inherit: true
        }
    },
    
    options: {
        /**
         * Добавить ячейки в конец поля
         * @type {string|Array.<string>|croc.ui.Widget|Array.<Widget>}
         */
        cellsAfter: {},
        
        /**
         * Добавить ячейки после ячейки с input
         * @type {string|Array.<string>|croc.ui.Widget|Array.<Widget>}
         */
        cellsAfterInput: {},
        
        /**
         * Добавить ячейки в начало поля
         * @type {string|Array.<string>|croc.ui.Widget|Array.<Widget>}
         */
        cellsBefore: {},
        
        /**
         * Плэйсхолдер скрывается не полностью в процессе заполнения поля
         */
        compositePlaceholder: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Класс type_... корневого элемента
         * @type {string}
         */
        cssType: {
            required: true
        },
        
        /**
         * Указывает как следует реагировать при изменении внутреннего значения поля извне (в обход API TextField).
         * Возможные значения: null - нет реакции, 'change' - изменить внешнее значение, 'update' - вызывать событие update
         * @type {String}
         */
        externalChangeReaction: {
            check: ['change', 'update']
        },
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<{tag} class="b-input set_default type_{cssType}{cls}">' +
        '   <div class="b-input-h">' +
        '       {before}' +
        '       <div class="b-input-cell cell_field">' +
        '           <div class="b-input-field">' +
        '               <div class="b-input-field-placeholder">{placeholder}</div>' +
        '               <{inputTag} name="{name}" class="b-input-field-h"{inputAttrs}{tabIndex}>{inputTagEnd}' +
        '           </div>' +
        '       </div>' +
        '       {afterInput}' +
        '       <div class="b-input-cell cell_action">' +
        '           <div class="b-input-action role_reset"></div>' +
        '           <div class="b-input-action role_loader"></div>' +
        '           <div class="b-input-action role_unfold"></div>' +
        '       </div>' +
        '       <div class="b-input-cell cell_validation">' +
        '           <div class="b-input-validation"></div>' +
        '       </div>' +
        '       {after}' +
        '   </div>' +
        '</{tag}>',
        
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
        showAction: {
            type: 'boolean',
            value: true
        },
        
        /**
         * Показывать ли крестик для сброса значения поля или нет
         * @type {Boolean}
         */
        showReset: {
            type: 'boolean',
            value: true
        },
        
        /**
         * Использовать проверку изменения значения по событию blur, вместо change
         * @type {boolean}
         */
        _checkValueOnBlur: true
    },
    
    members: {
        /**
         * Текущий экшен поля (reset, loader и т.д.)
         * @return {String}
         */
        getAction: function() {
            return this.__action || null;
        },
        
        /**
         * Возвращает элемент-контэйнер для элементов-экшенов
         * @return {jQuery}
         */
        getActionsContainer: function() {
            return this.__actionElement.getElement();
        },
        
        /**
         * Экшен поля по-умолчанию (активируется при вызове resetAction)
         * @return {String}
         */
        getDefaultAction: function() {
            return this.__defaultAction;
        },
        
        /**
         * Html-элемент поля
         * @return {jQuery}
         */
        getFieldElement: function() {
            return this.__fieldElement ||
                (this.getElement() && (this.__fieldElement = this.getElement().find('.b-input-field-h')));
        },
        
        /**
         * @returns {jQuery}
         */
        getPlaceholderElement: function() {
            return this.__placeholderEl;
        },
        
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
        
        /**
         * Установить экшен по-умолчанию
         */
        resetAction: function() {
            this.setAction(this.__defaultAction, this.__defaultActionCallback);
        },
        
        /**
         * Установить экшен поля (reset, loader и т.д.)
         * @param {String} action
         * @param {Function} [callback=null] функция будет вызвана при клике на экшен-элемент
         */
        setAction: function(action, callback) {
            var oldAction = this.__action;
            this.__action = action;
            this.__actionCallback = callback;
            if (this.__showAction) {
                this.__actionElement.setRole(action);
                this.__actionElement.setProperty('state_active', !!action);
            }
            
            if (oldAction !== action) {
                this.fireEvent('changeAction', action, oldAction);
            }
        },
        
        /**
         * Установить экшен по-умолчанию
         * @param action
         * @param [callback=null]
         */
        setDefaultAction: function(action, callback) {
            this.__defaultAction = action;
            this.__defaultActionCallback = callback;
        },
        
        /**
         * Изменить значение поля, игнорируя трансформацию
         * @param {string} value
         */
        setValueWithoutTransform: function(value) {
            var transformOnUpdate = this.getTransformOnUpdate();
            var transformOnChange = this.getTransformOnChange();
            this.setTransformOnUpdate(null);
            this.setTransformOnChange(null);
            this.setValue(value);
            this.setTransformOnUpdate(transformOnUpdate);
            this.setTransformOnChange(transformOnChange);
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            function getCellsHtml(cells) {
                return !cells ? '' : cells.map(function(cell) {
                    return cell instanceof croc.ui.Widget ? croc.utils.defSync(cell.createHtml()) : cell;
                }).join('');
            }
            
            return _.assign(croc.ui.form.field.AbstractTextField.superclass._getAddRenderData.apply(this, arguments), {
                tag: Stm.env.device === 'desktop' ? 'label' : 'div',
                placeholder: options.placeholder || '',
                name: options.identifier,
                before: getCellsHtml(this.__cellsBefore),
                after: getCellsHtml(this.__cellsAfter),
                afterInput: getCellsHtml(this.__cellsAfterInput),
                cssType: options.cssType
            });
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.AbstractTextField.superclass._initWidget.call(this);
            
            //elements
            this.__actionElement = croc.ui.Element.create(this.getElement().find('.b-input-cell.cell_action'), 'role');
            
            this.__setUpAbstractTextFieldBehavior();
            this.__setUpPlaceholder();
            this.__setUpSuggest();
            this.__setUpActions();
            this.__initCells();
            
            if (this.__selectionBehavior) {
                this.__setUpSelectionBehavior();
            }
            
            if (croc.util.Browser.isIE(8)) {
                this.getFieldElement().on('keypress', function(e) {
                    var parentForm;
                    if (e.keyCode === 13/*ENTER*/ && (parentForm = this.getElement().closest('form')).length) {
                        parentForm.submit();
                    }
                }.bind(this));
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__externalChangeReaction = options.externalChangeReaction;
            this.__selectionBehavior = options.selectionBehavior;
            this.__showAction = options.showAction;
            this.__showReset = options.showReset;
            this.__compositePlaceholder = options.compositePlaceholder;
            this.__checkValueOnBlur = options._checkValueOnBlur;
            this.__resetFn = options.resetFn;
            
            function mapCells(cells) {
                return cells && (Array.isArray(cells) ? cells : [cells]).map(function(cell) {
                        if (typeof cell === 'object' && !(cell instanceof croc.ui.Widget)) {
                            return new cell.xtype(_.omit(cell, 'xtype'));
                        }
                        return cell;
                    });
            }
            
            this.__cellsAfter = mapCells(options.cellsAfter);
            this.__cellsBefore = mapCells(options.cellsBefore);
            this.__cellsAfterInput = mapCells(options.cellsAfterInput);
            
            croc.ui.form.field.AbstractTextField.superclass._onPropertiesInitialized.apply(this, arguments);
            
            this.__instantValue = this.getValue();
            this.on('changeValue', function(value) {
                this.__setInstantValue(value);
            }, this);
            
            if (options.compositePlaceholder && !this.getTransformOnChange()) {
                this.setTransformOnChange(croc.ui.form.field.transform.trimLeftAndMultiSpaces);
            }
        },
        
        /**
         * @param value
         * @param old
         * @returns {string}
         * @protected
         */
        _transformInstantValue: function(value, old) {
            var newValue = this.getTransformOnUpdate() ? this.getTransformOnUpdate()(value, old) : value;
            if (this.getFieldElement() && newValue !== value && newValue !== (this._getFieldValue() || null)) {
                this.getFieldElement().val(newValue);
                this._internalChangeTriggering = true;
                this.getFieldElement().change();
                this._internalChangeTriggering = false;
            }
            return newValue;
        },
        
        /**
         * @param value
         * @param old
         * @returns {string}
         * @protected
         */
        _transformValue: function(value, old) {
            var instantValue = this.getInstantValue();
            if (value !== instantValue && old !== instantValue) {
                this.setValue(instantValue);
            }
            return this.getTransformOnChange() ? this.getTransformOnChange()(value, old) : value;
        },
        /**
         * @private
         */
        __initCells: function() {
            var cells = this.getElement().find('.b-input-cell');
            if (this.__cellsBefore) {
                this.__cellsBefore.forEach(function(cell, index) {
                    if (cell instanceof croc.ui.Widget) {
                        cell.initWith(cells.eq(index));
                    }
                }, this);
            }
            if (this.__cellsAfter) {
                this.__cellsAfter.forEach(function(cell, index) {
                    if (cell instanceof croc.ui.Widget) {
                        cell.initWith(cells.eq(-index - 1));
                    }
                }, this);
            }
            if (this.__cellsAfterInput) {
                var fieldIndex = cells.index(cells.filter('.cell_field'));
                this.__cellsAfterInput.forEach(function(cell, index) {
                    if (cell instanceof croc.ui.Widget) {
                        cell.initWith(cells.eq(fieldIndex + index + 1));
                    }
                }, this);
            }
        },
    
        /**
         * @private
         */
        __mobileShowOnFocus: function() {
            var winEl = $(window);
            var el = this.getElement();
            var gap = 20;
            var scroll = function() {
                var scrollable = this.getFieldElement();
                while (true) {
                    scrollable = scrollable.parents('.g-scrollable-h:eq(0)');
                    if (!scrollable.length) {
                        scrollable = winEl;
                        break;
                    }
                    if (scrollable[0].clientHeight < scrollable[0].scrollHeight) {
                        break;
                    }
                }
                
                var delta;
                if (this._options.mobileScrollTop) {
                    delta = el.offset().top - winEl.scrollTop() - gap;
                }
                else {
                    delta = Math.max(0, el.offset().top + el.height() - (winEl.scrollTop() + window.innerHeight) + gap);
                }
                if (delta !== 0) {
                    scrollable.scrollTop(scrollable.scrollTop() + delta);
                }
            }.bind(this);
            
            var timeout;
            this.getFieldElement().on({
                focus: function() {
                    timeout = this._getDisposer().setTimeout(scroll, 300);
                }.bind(this),
                blur: function() {
                    if (timeout) {
                        timeout.remove();
                    }
                }
            });
        },
        
        /**
         * @private
         */
        __setUpAbstractTextFieldBehavior: function() {
            var inputEl = this.getFieldElement();
            
            inputEl
                .on('input propertychange keyup focus blur', function(e) {
                    this.__setInstantValue(this._getFieldValue());
                }.bind(this))
                .on('cut', function() {
                    this._getDisposer().defer(function() {
                        this.__setInstantValue(this._getFieldValue());
                    }, this);
                }.bind(this));
            
            if (this.__externalChangeReaction) {
                this._getDisposer().setInterval(function() {
                    if (this.__externalChangeReaction === 'update') {
                        this.__setInstantValue(this._getFieldValue());
                    }
                    else {
                        this.setValue(this._getFieldValue());
                    }
                }.bind(this), croc.ui.form.field.AbstractTextField.__LISTEN_VALUE_CHANGE_INTERVAL);
            }
            
            if (Stm.env.device === 'desktop') {
                this.getElement().mousedown(_.throttle(this.disposableFunc(function() {
                    this.getFieldElement().focus();
                }, this)));
            }
            else if (Stm.env.ldevice === 'mobile') {
                this.__mobileShowOnFocus();
            }
            
            //don't focus field on click on action
            var cellAction = this.getElement().find('.b-input-cell.cell_action');
            cellAction.mousedown(function(e) {e.stopPropagation();});
            cellAction.on('touchstart', function(e) {e.stopPropagation();});
        },
        
        /**
         * @private
         */
        __setUpActions: function() {
            if (this.__showReset) {
                this.listenProperty('instantValue', function(value) {
                    if (value) {
                        if (!this.getDefaultAction()) {
                            this.setDefaultAction('reset', function() {
                                this.__resetFn(this);
                                this.focus();
                            }.bind(this));
                        }
                        if (!this.getAction()) {
                            this.resetAction();
                        }
                    }
                    else {
                        if (this.getDefaultAction() === 'reset') {
                            this.setDefaultAction(null);
                        }
                        if (this.getAction() === 'reset') {
                            this.setAction(null);
                        }
                    }
                }, this);
            }
            
            if (this.__showAction) {
                this.__actionElement.getElement().on({
                    click: function() {
                        return this.__actionCallback ? this.__actionCallback() : undefined;
                    }.bind(this)
                });
            }
        },
        
        /**
         * @param {croc.ui.Element} placeholderEl
         * @private
         */
        __setUpCompositePlaceholder: function(placeholderEl) {
            this.__testElement = $(croc.ui.form.field.AbstractTextField.__TEMPLATE_TEST_ELEMENT)
                .insertBefore(this.getFieldElement());
            
            var update = function() {
                this.__updateCompositeTestElement();
                this.__updateCompositePlaceholder(placeholderEl);
            }.bind(this);
            
            croc.Object.listenProperties(this, 'placeholder', this, 'instantValue', update);
            this.onAppear(update);
        },
        
        /**
         * @private
         */
        __setUpPlaceholder: function() {
            var placeholderEl = croc.ui.Element.create(
                this.__placeholderEl = this.getElement().find('.b-input-field-placeholder'));
            var fieldEl = this.getFieldElement();
            
            if (fieldEl.attr('placeholder')) {
                this.setPlaceholder(fieldEl.attr('placeholder'));
                fieldEl.removeAttr('placeholder');
            }
            else if (placeholderEl.getText() && !this.getPlaceholder()) {
                this.setPlaceholder(placeholderEl.getText());
            }
            
            if (this.__compositePlaceholder) {
                this.__setUpCompositePlaceholder(placeholderEl);
            }
            else {
                this.bind('instantValue', placeholderEl, 'shown', function(x) { return !x; });
                this.bind('placeholder', placeholderEl, 'text');
            }
        },
        
        /**
         * @private
         */
        __setUpSelectionBehavior: function() {
            var smartSelectOnClick = this.__selectionBehavior === 'smartSelectOnClick';
            var selectOnFocus = this.__selectionBehavior === 'selectOnFocus';
            if (!smartSelectOnClick && !selectOnFocus) {
                throw new Error('Передано неверное значение опции selectionBehavior!');
            }
            
            if (croc.util.Browser.isOpera()) {
                this.getFieldElement().on('focus', function() {
                    $(this).select();
                });
            }
            else {
                var prevSelection;
                var focused;
                var field = this.getFieldElement();
                
                this.getFieldElement().on({
                    mousedown: function() {
                        focused = !$(this).is(':focus');
                        prevSelection = croc.utils.domGetTextSelection($(this));
                    },
                    mouseleave: function() {
                        prevSelection = null;
                    },
                    mouseup: function(e) {
                        if (!prevSelection) {
                            return;
                        }
                        
                        var selection = croc.utils.domGetTextSelection(field);
                        
                        var select;
                        if (selectOnFocus) {
                            select = focused;
                        }
                        else {
                            select = (focused || selection.length !== field.val().length) &&
                            ((prevSelection.start === selection.start && prevSelection.end === selection.end) ||
                            selection.length === 0);
                        }
                        
                        if (select) {
                            field.select();
                            e.preventDefault();
                        }
                    }
                });
            }
        },
        
        /**
         * @private
         */
        __setUpSuggest: function() {
            var suggestEl = this.getElement().find('.b-input-cell.cell_suggest');
            if (suggestEl.length) {
                var link = suggestEl.find('.g-pseudo');
                link.on('click', function() {
                    this.setValue(link.text());
                    this.focus();
                }.bind(this));
                
                this.listenProperty('instantValue', function(value) {
                    suggestEl.toggleClass('g-hidden', !!value);
                });
            }
        },
        
        /**
         * @param placeholderEl
         * @private
         */
        __updateCompositePlaceholder: function(placeholderEl) {
            var value = this.getInstantValue() || '';
            var placeholder = this.getPlaceholder() || '';
            
            var lastSpace = value.charAt(value.length - 1) === ' ';
            var chunksCount = value ? croc.ui.form.field.transform.trimLeftAndMultiSpaces(value).split(' ').length : 0;
            if (lastSpace) {
                chunksCount -= 1;
            }
            
            var text = (lastSpace || !value ? '' : '&nbsp;') + placeholder.split(' ').slice(chunksCount).join(' ');
            placeholderEl.getElement().html(text);
            
            var label = placeholderEl.getElement();
            label.css('marginLeft', value ? this.__testElement.outerWidth() : '');
            
            label.css('visibility', label.width() < label.outerWidth() / 2 ? 'hidden' : 'visible');
        },
        
        /**
         * @private
         */
        __updateCompositeTestElement: function() {
            this.__testElement.html(_.escape(this.getInstantValue() || '').replace(/ /g, '&nbsp;'));
        }
    }
});
