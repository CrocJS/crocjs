//+use $.autogrowinput

/**
 * Комбобокс
 */
croc.Class.define('croc.ui.form.field.ComboBox', {
    extend: croc.ui.form.field.AbstractFieldWrapper,
    implement: [
        croc.ui.form.field.IDisable,
        croc.ui.form.field.ISizable,
        croc.ui.form.field.ITextField
    ],
    include: [
        croc.ui.form.field.MDisableFieldWrapper,
        croc.ui.form.field.MSizableFieldWrapper,
        croc.ui.form.field.MAbstractTextFieldWrapper,
        croc.ui.form.field.MTextFieldWrapper
    ],
    
    statics: {
        /**
         * @private
         * @static
         */
        __TEMPLATE_ADD_ITEM: '<span class="b-input-combo-button view_add"><span class="b-input-combo-button-action"></span> добавить</span>',
        
        /**
         * @private
         * @static
         */
        __TEMPLATE_HIDDEN_INPUT: '<input type="hidden" class="b-input-combo-hidden" name="{name}" value="{value}">',
        
        /**
         * @private
         * @static
         */
        __TEMPLATE_MULTISELECT_ITEM: '' +
        '<span class="b-input-combo-button view_added{cls}">' +
        '{text} <span class="b-input-combo-button-action"></span><input type="hidden" name="{name}" value="{value}">' +
        '</span>',
        
        /**
         * Создаёт компонент подсказок на основе массива опций
         * @param {Array} options
         * @param {Object} [addConf]
         * @returns {croc.ui.form.suggestion.Default}
         */
        createSuggestionFromOptions: function(options, addConf) {
            return new croc.ui.form.suggestion.Default(croc.Object.mergeConf({
                model: new croc.data.MappedArray({
                    original: options.map(function(option) {
                        return typeof option === 'string' ? {text: option, value: option} : option;
                    })
                })
            }, addConf));
        }
    },
    
    properties: {
        /**
         * Разрешено ли добавление/выбор новых значений
         */
        addingValues: {
            field: '__addingValues',
            apply: '__applyAddingValues',
            value: true,
            event: true,
            option: true
        },
        
        /**
         * Показывать кнопку "добавить"
         * @type {boolean}
         */
        addButton: {
            cssClass: 'addbutton',
            type: 'boolean',
            value: false,
            __getter: null,
            __setter: null,
            option: true
        },
        
        /**
         * Разрешить фильтрацию по значениям списка
         * В режимах {@link #mode} 'select', 'multiselect' поле поиска просто исчезает
         * в режиме 'default' текстовое поле остаётся, но фильтрация по значениям не происходит
         * @type {boolean}
         */
        enableFiltering: {
            cssClass: 'filtering',
            type: 'boolean',
            value: true,
            getter: null,
            __setter: null,
            event: true,
            option: true
        },
        
        /**
         * Массив элементов, которые следует исключить из подсказки
         * @type {Array}
         */
        excludes: {
            type: 'array',
            value: [],
            event: true
        },
        
        /**
         * Режим работы компонента
         * @type {string}
         */
        mode: {
            check: ['default', 'select', 'multiselect'],
            value: 'default',
            cssClass: 'role',
            getter: null,
            __setter: null,
            option: true
        },
        
        /**
         * Значение поля
         * @type {Array.<croc.ui.form.field.ComboBox.ValueType>|croc.ui.form.field.ComboBox.ValueType|string}
         */
        value: {
            type: ['array', 'object', 'string'],
            transform: '__transformValue',
            apply: '__applyValue',
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * Опции для работы по типу селекта
         * @type {Array.<croc.ui.form.field.ComboBox.ValueType|string>}
         */
        options: {
            type: 'array'
        },
        
        /**
         * Плэйсхолдер для поля. Только для режимов default и select
         * @type {string}
         */
        placeholder: {
            type: 'string'
        },
        
        /**
         * Плоское значение поля
         */
        plainValue: null,
        
        /**
         * Подсказка для поля поиска
         * @see croc.ui.form.field.TextField.options.suggestion
         */
        suggestion: null,
        
        /**
         * Конфиг для текстового поля
         * @type {Object}
         */
        textFieldConf: {
            extend: true,
            value: {}
        },
        
        /**
         * проксировать ли событие changeValue
         * @type {boolean}
         */
        _proxyChangeValueEvent: false,
        
        /**
         * Если контейнер является враппером над одним виджетом без внешнего html. Если передано true,
         * то считается что оборачивается секция по умолчанию, иначе должна быть передана оборачиваемая
         * секция.
         * @type {string|boolean}
         */
        _wrapSection: true
    },
    
    members: {
        /**
         * Убрать фокус у элемента
         */
        blur: function() {
            croc.ui.form.field.MTextFieldWrapper.prototype.blur.apply(this, arguments);
            
            if (this.__itemsSelection) {
                this.__itemsSelection.removeAll();
            }
        },
        
        /**
         * Значение поля в виде строки либо массива, которое однозначно идентифицурет состояние поля и может быть отправлено
         * аякс-запросом на сервер
         * @type {string|Array}
         */
        getPlainValue: function() {
            return this.getValue() && (!this.__isSelect ? this.getValue() : this.__isMultiSelect ?
                    this.getValue().map(function(x) { return x.value; }) :
                    this.getValue().value);
        },
        
        /**
         * Подсказка к полю
         * @returns {croc.ui.form.suggestion.Default}
         */
        getSuggestion: function() {
            return this.__suggestion;
        },
        
        /**
         * Пробелы на концах значения являются важными и их нельзя обрезать
         * @returns {boolean}
         */
        keepWhiteSpace: function() {
            return true;
        },
        
        /**
         * Поле в начальном, пустом состоянии
         * @returns {boolean}
         */
        isEmptyState: function() {
            return this.isEmpty() && (!this.__textField || this.__textField.isEmpty());
        },
        
        /**
         * Открыть подсказки
         */
        openSuggestion: function() {
            var suggestion = this.__suggestion;
            if (!suggestion.getModel().getSearchString()) {
                this.__suggestion.showItemsUnfiltered();
                this.__textField.focus();
            }
            else if (suggestion.getItems().length > 0) {
                suggestion.open();
                this.__textField.focus();
            }
        },
        
        /**
         * Изменить недоступность поля
         * @param {boolean} value
         */
        setDisabled: function(value) {
            croc.ui.form.field.MDisableFieldWrapper.prototype.setDisabled.apply(this, arguments);
            
            if (this.__suggestion) {
                this.__suggestion.close(true);
            }
            if (this.__itemsSelection) {
                this.__itemsSelection.removeAll();
            }
        },
        
        /**
         * Назначить плоское значение
         * @param value
         */
        setPlainValue: function(value) {
            if (value === null || !this.__isSelect) {
                this.setValue(value);
                return;
            }
            
            var found = this.__suggestion.getModel().getArray().some(function(item) {
                item = this.__suggestion.getNormalizedItem(item);
                if (item.value === value) {
                    this.setValue(item);
                    return true;
                }
            }, this);
            
            if (!found) {
                throw new Error('Не найдено комплексное значение для переданного плоского: ' + value);
            }
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            //кнопку нужно добавить перед запуском контроллера ContainerItemsController
            if (this.isHtmlGenerated() && this.__isMultiSelect) {
                this.getElement().find('.b-input-field-placeholder')
                    .before(croc.ui.form.field.ComboBox.__TEMPLATE_ADD_ITEM);
            }
            
            croc.ui.form.field.ComboBox.superclass._initWidget.call(this);
            
            this.__inputCell = this.getElement().find('.b-input-cell.cell_field');
            
            /**
             * @type {croc.ui.form.suggestion.Default}
             * @private
             */
            this.__suggestion = this.__textField.getSuggestion();
            this.__suggestion.setDisableTextSelection(true);
            this.__suggestion.setShowUnfilteredOnFocus(true);
            this.__suggestion.setUpdateInputOnChooseItem(false);
            this.__suggestion.removeDirtyState();
            this.__suggestion.setTarget(this.getElement());
            
            if (!this.__enableFiltering && !this.__isSelect) {
                this.__suggestion.disableFiltering();
            }
            
            if (!this.__addingValues) {
                //disable suggestion
                this.__applyAddingValues(false);
            }
            
            if (this.__plainValue) {
                this.setPlainValue(this.__plainValue);
            }
            
            if (this.__isMultiSelect) {
                this.__setUpMultiSelect();
            }
            else {
                if (this.isHtmlGenerated()) {
                    this.__hiddenInput = $(croc.ui.form.field.ComboBox.__TEMPLATE_HIDDEN_INPUT.render({
                        name: this.getIdentifier() || '',
                        value: this.getPlainValue() || ''
                    })).insertAfter(this.getFieldElement());
                }
                else {
                    this.__hiddenInput = this.getElement().find('.b-input-combo-hidden');
                }
                
                this.__setUpSelectOrComboBox();
            }
            
            this.__setUpGeneralBehavior();
            this.__setUpArrow();
            this.__setUpKeyboard();
            
            this.onAppear(this._onResize, this);
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.ComboBox.superclass._onPropertiesInitialized.apply(this, arguments);
            
            this._addExtendingWrapperOptions('suggestion', 'placeholder');
            this._removeExtendingWrapperOptions('identifier');
            this._removeExtendingWrapperOptions('value');
            
            this.__isMultiSelect = options.mode === 'multiselect';
            this.__isSelect = options.mode !== 'default';
            this.__enableFiltering = options.enableFiltering;
            this.__plainValue = options.plainValue;
            this.__addButton = options.addButton;
            this.__comboboxPropertiesInitialized = true;
            this.__addingValuesSuggestion = null;
            if (!this.__addingValues) {
                this.__applyAddingValues(false);
            }
            
            if (this.__isMultiSelect) {
                options.extraCls = (options.extraCls ? options.extraCls + ' ' : '') + 'state_raw';
            }

//            if (this.getElement() && this.__isSelect && !this.__isMultiSelect) {
//                this.__initFromNativeSelect(options);
//            }
            
            if (options.options && (!options.suggestion || _.isPlainObject(options.suggestion))) {
                this.__suggestion = options.suggestion =
                    croc.ui.form.field.ComboBox.createSuggestionFromOptions(options.options,
                        _.assign({size: this.getSize()}, options.suggestion));
            }
            
            if (options.value) {
                this.setValue(options.value);
            }
            
            if (this.__isMultiSelect) {
                this.__initMultiSelect(options);
            }
            
            options.items.wrappedField = [
                this.__textField = new croc.ui.form.field.TextField(croc.Object.mergeConf(this._extendWithWrapperOptions({
                    selectionBehavior: this.__isSelect && !this.__isMultiSelect ? 'selectOnFocus' : null,
                    value: this.__isMultiSelect || !this.getValue() ? null :
                        this.__isSelect ? this.getValue().text : this.getValue(),
                    showReset: false,
                    cssType: 'combobox',
                    manageFocus: !this.__isMultiSelect,
                    mobileScrollTop: true
                }), options.textFieldConf))
            ];
            if (this.__isSelect) {
                this.bind('enableFiltering', this.__textField, 'readOnly', function(x) { return !x; });
            }
        },
        
        /**
         * Внутренняя реализация onResize
         * @param {string} [reason]
         * @protected
         */
        _onResize: function(reason) {
            var el = this.getElement();
            if (this.__isMultiSelect && !el.hasClass('state_raw')) {
                var containerEl = el.find('.b-input-field');
                el.addClass('state_raw');
                containerEl.css('width', '');
                containerEl.width(containerEl.width());
                el.removeClass('state_raw');
            }
            
            croc.ui.form.field.ComboBox.superclass._onResize.apply(this, arguments);
        },
        
        /**
         * @param value
         * @private
         */
        __applyAddingValues: function(value) {
            if (this.__comboboxPropertiesInitialized) {
                if (value) {
                    this.__setAddButton(!!this.__addButton);
                    this.__setEnableFiltering(!!this.__enableFiltering);
                    if (this.__suggestion && this.__addingValuesSuggestion !== null) {
                        this.__suggestion.setDisabled(this.__addingValuesSuggestion);
                    }
                }
                else {
                    this.__setAddButton(false);
                    this.__setEnableFiltering(false);
                    this.__addingValuesSuggestion = this.__suggestion ? !!this.__suggestion.getDisabled() : null;
                    if (this.__suggestion) {
                        this.__suggestion.setDisabled(true);
                    }
                }
                if (this.getElement()) {
                    this.getElement().toggleClass('adding_false', !value);
                }
            }
        },
        
        /**
         * @param value
         * @private
         */
        __applyValue: function(value) {
            //если не был вызван _initWidget
            if (!this.__suggestion) {
                return;
            }
            
            if (value && (
                (!this.__isSelect && typeof value !== 'string') ||
                (this.__isMultiSelect && !Array.isArray(value)) ||
                (!this.__isMultiSelect && Array.isArray(value))
                )) {
                throw new TypeError('Тип переданного значения некорректен!');
            }
            
            if (this.__isMultiSelect) {
                if (!value) {
                    value = [];
                }
                
                if (this.getRendered() && !croc.utils.arrEqual(this.__itemsArray.getArray(), value)) {
                    this.__itemsArray.replaceAll(value);
                }
            }
            else {
                if (this.__hiddenInput) {
                    this.__hiddenInput.val(this.getPlainValue());
                }
                if (this.__textField && !this.__dontSetTextFieldValue) {
                    this.__textFieldInternalUpdate = true;
                    this.__textField.setValue(this.__isSelect && value ? value.text : value);
                    this.__textFieldInternalUpdate = false;
                    
                    if (this.__isSelect) {
                        this.__suggestion.getModel().setSearchString(null);
                    }
                }
            }
        },

//        /**
//         * @param {Object} options
//         * @private
//         */
//        __initFromNativeSelect: function(options) {
//            var nativeSelect = this.getElement().find('.b-input.type_select');
//            if (!nativeSelect.length) {
//                return;
//            }
//
//            options.options = nativeSelect.find('option').get().map(function(option) {
//                option = $(option);
//                var item = {
//                    value: option.attr('value') || null,
//                    text: option.html()
//                };
//                if (option.attr('selected')) {
//                    this.setValue(item);
//                }
//                return item;
//            }.bind(this));
//
//            nativeSelect.remove();
//            this.getElement().find('.b-combobox-field').prepend(this.__renderHiddenInput());
//        },
        
        /**
         * @param options
         * @private
         */
        __initMultiSelect: function(options) {
            this.__itemsArray = new croc.data.ObservableArray({
                original: this.getValue(),
                listeners: {
                    change: function() {
                        this.setValue(this.__itemsArray.getLength() > 0 ? this.__itemsArray.cloneRawArray() : null);
                    }.bind(this)
                }
            });
            
            this.__itemsController = this.setItemsController('items', this.__itemsArray, {
                itemsSelector: '.b-input-combo-button.view_added',
                selectedItemClass: 'state_active',
                insertItemFn: croc.ui.ContainerItemsController
                    .createInsertBeforeFn(this, '.b-input-combo-button.view_add'),
                
                itemRenderer: function(item) {
                    return croc.ui.form.field.ComboBox.__TEMPLATE_MULTISELECT_ITEM.render(_.assign({
                        name: this.getIdentifier() ? this.getIdentifier() + '[]' : ''
                    }, item));
                }.bind(this)
            });
            this.__itemsSelection = this.__itemsController.getSelection();
        },
        
        /**
         * @private
         */
        __setUpArrow: function() {
            this.__textField.setDefaultAction('unfold');
            this.__textField.resetAction();
            
            var arrowEl = this.getElement().find('.b-input-action.role_unfold');
            var wasShown;
            arrowEl
                .mousedown(function(e) {
                    wasShown = this.__suggestion.getOpen();
                    e.stopPropagation();
                }.bind(this))
                .click(function(e) {
                    if (wasShown) {
                        this.__suggestion.close();
                    }
                    else {
                        this.__textField.focus();
                    }
                    e.preventDefault();
                }.bind(this));
            
            this.__suggestion.listenProperty('open', function(value) {
                arrowEl.toggleClass('state_hover', value);
            }, this);
        },
        
        /**
         * @private
         */
        __setUpGeneralBehavior: function() {
            this.__textField.on('focus', function() {
                this.__textField.moveCursorToEnd();
            }, this);
            
            //if (Stm.env.device !== 'desktop') {
            //    this._getDisposer().addListener($(document), 'touchstart', function(e) {
            //        if (!croc.utils.domIsElementOpenerOf(this.getElement(), $(e.target), true)) {
            //            this.blur();
            //        }
            //    }, this);
            //}
            
            var model = this.__suggestion.getModel();
            if (!croc.Interface.check(model, 'croc.data.IStreamList')) {
                //reset model on close
                this.__suggestion.on('close', function() {
                    model.setSearchString(null);
                }, this);
                
                //reset search string on empty model
                model.listenChanges(function() {
                    if (model.getLength() === 0 && model.getSearchString()) {
                        model.setSearchString(null);
                    }
                });
            }
        },
        
        /**
         * @private
         */
        __setUpItemsManagement: function() {
            //add
            this.__suggestion.on('select', function(item) {
                this.__itemsArray.push(this.__suggestion.getNormalizedItem(item));
                this.__textField.setValue('');
                
                //todo исправить это в новых компонентах
                this.__suggestion.close();
                this._getDisposer().defer(function() {
                    this.__suggestion.close();
                }, this);
            }, this);
            
            //remove
            this.__inputCell.on('click', '.b-input-combo-button.view_added .b-input-combo-button-action',
                function(e) {
                    if (this.getDisabled()) {
                        return;
                    }
                    this.__itemsArray.removeAt(this.__itemsController.getListItemIndex($(e.currentTarget)));
                }.bind(this));
            
            //select
            this.__inputCell.on('mousedown', '.b-input-combo-button.view_added', function(e) {
                e.stopPropagation();
                croc.publish('system._combobox-button-click', this);
            }.bind(this));
            this.__inputCell.on('click', '.b-input-combo-button.view_added', function(e) {
                if (this.getDisabled() ||
                    (e.target.tagName.toLowerCase() === 'input' && e.target.type.toLowerCase() === 'hidden')) {
                    return;
                }
                
                this.__itemsSelection.setSingleItemIndex(this.__itemsController.getListItemIndex($(e.target)));
                e.preventDefault();
            }.bind(this));
            
            //blur
            this._getDisposer().addListener($(document), 'mousedown', function() {
                this.__itemsSelection.removeAll();
            }, this);
            
            this._getDisposer().addListener(croc, 'system._combobox-button-click', function(combobox) {
                if (this !== combobox) {
                    this.__itemsSelection.removeAll();
                }
            }, this);
        },
        
        /**
         * @private
         */
        __setUpKeyboard: function() {
            var selection = this.__itemsSelection;
            
            //если курсор стоит в начале текстового поля, то выделяем последний элемент
            var inputLeftOverflow = function() {
                var textSelection;
                if (this.__itemsArray.getLength() > 0 && this.getFieldElement().is(':focus') &&
                    (textSelection = croc.utils.domGetTextSelection(this.getFieldElement())).start === 0 &&
                    textSelection.start === textSelection.end) {
                    
                    this.__textField.blur();
                    selection.setSingleItem(this.__itemsArray.getItem(this.__itemsArray.getLength() - 1));
                    return true;
                }
                return false;
            }.bind(this);
            
            this._getDisposer().addListener($(document), 'keydown', function(e) {
                if (this.getDisabled()) {
                    return;
                }
                
                var keyCode = e.keyCode;
                
                //noinspection FallthroughInSwitchStatementJS
                switch (keyCode) {
                    case 38: //TOP
                    case 40: //BOTTOM
                        var top = keyCode === 38;
                        if (!this.__suggestion.getOpen() &&
                            this.getFieldElement().is(':focus')) {
                            this.openSuggestion();
                            if (this.__suggestion.getOpen()) {
                                this.__suggestion.getSelection().setSingleItemIndex(
                                    top ? this.__suggestion.getItems().length - 1 : 0);
                            }
                        }
                        break;
                    
                    case 37: //LEFT
                    case 39: //RIGHT
                        if (!this.__isMultiSelect) {
                            break;
                        }
                        
                        var left = keyCode === 37;
                        if (selection.getLength()) {
                            var newIndex = Math.max(0, selection.getFirstItemIndex() + (left ? -1 : 1));
                            if (newIndex >= this.__itemsArray.getLength()) {
                                selection.removeAll();
                                this.__textField.focus();
                                croc.utils.domSetCaretPos(this.getFieldElement(), 0);
                                e.preventDefault();
                            }
                            else {
                                selection.setSingleItemIndex(newIndex);
                            }
                        }
                        else if (left) {
                            inputLeftOverflow();
                        }
                        
                        break;
                    
                    case 46: //DELETE
                    case 8: //BACKSPACE
                        if (!this.__isMultiSelect) {
                            break;
                        }
                        
                        var backspace = keyCode === 8;
                        if (selection.getLength()) {
                            var index = selection.getFirstItemIndex();
                            this.__itemsArray.remove(selection.getFirstItem());
                            if (this.__itemsArray.getLength() > 0) {
                                selection.setSingleItemIndex(Math.min(this.__itemsArray.getLength() - 1,
                                    Math.max(0, backspace ? index - 1 : index)));
                            }
                            else {
                                this.__textField.focus();
                            }
                            e.preventDefault();
                        }
                        else if (backspace) {
                            if (inputLeftOverflow()) {
                                e.preventDefault();
                            }
                        }
                        break;
                }
                
            }, this);
        },
        
        /**
         * @private
         */
        __setUpMultiSelect: function() {
            var model = this.__suggestion.getModel();
            
            //set/restore value
            if (!this.isHtmlGenerated()) {
                if (this.__itemsArray.getLength()) {
                    this.setValue(this.__itemsArray.cloneRawArray());
                }
            }
            if (this.getValue() && this.getValue().length && !this.__itemsArray.getLength()) {
                this.__itemsArray.replaceAll(this.getValue());
            }
            
            //excludes
            croc.Object.multiBind(
                this, 'value',
                this, 'excludes',
                model, 'excludes',
                function(value, excludes) {
                    return (value || []).concat(excludes || []);
                }, this);
            
            //add button
            if (this.__addButton) {
                this.__addButton = this.getElement().find('.b-input-combo-button.view_add');
                var fieldEl = this.getFieldElement();
                croc.Object.listenProperties(
                    this.__textField, ':blur',
                    this.__textField, ':focus',
                    this.__textField, 'instantValue',
                    this.__suggestion, 'open',
                    _.debounce(this.disposableFunc(function(blur, focus, value, suggOpen) {
                        var showAddButton = !value && !suggOpen && !fieldEl.is(':focus');
                        this.__toggleTextField(!showAddButton);
                        this.__addButton.toggleClass('b-hidden', !showAddButton);
                    }, this), 50));
            }
            
            if (this.__enableFiltering) {
                if (this.__addButton) {
                    this.getFieldElement().css('minWidth',
                        this.__addButton.outerWidth() + _.parseInt(this.__addButton.css('marginRight')));
                }
                
                this.getFieldElement().autoGrowInput({
                    comfortZone: 20
                });
                
                //позиционируем подсказки в случае если высота поля изменилась из-за плагина autoGrowInput
                this.__suggestion.on('changeOpen', function(value) {
                    if (value) {
                        this._getDisposer().defer(function() {
                            if (this.__suggestion.getOpen()) {
                                this.__suggestion.reposition();
                            }
                        }, this);
                    }
                }, this);
            }
            
            //b-input-field sizing
            this._getDisposer().addListener(croc, 'system.application.load', function() {
                var containerEl = this.getElement().find('.b-input-field');
                containerEl.width(containerEl.width());
                this.getElement().removeClass('state_raw');
                this.getFieldElement().trigger('autogrowinput');
            }, this);
            this.on('validClassChanged', function() {
                this._onResize();
            }, this);
            
            this.__setUpItemsManagement();
            this.__setUpMultiSelectFocus();
        },
        
        /**
         * @private
         */
        __setUpMultiSelectFocus: function() {
            var focusObservable = croc.Object.createModel({rawFocus: false, focus: false});
            
            this.__textField.getFieldElement().on({
                focus: function() {
                    this.__textField.fireEvent('focus');
                    focusObservable.setRawFocus(true);
                }.bind(this),
                blur: function() {
                    this.__textField.fireEvent('blur');
                    focusObservable.setRawFocus(false);
                }.bind(this)
            });
            
            croc.Object.multiBind(
                this.__itemsSelection, 'length',
                focusObservable, 'rawFocus',
                focusObservable, 'focus',
                function(length, focus) {
                    return length > 0 || focus;
                }, this);
            
            focusObservable.on('changeFocus', function(value) {
                this.getElement().toggleClass('state_focus', value);
                this.fireEvent(value ? 'focus' : 'blur');
            }, this);
            
            if (this.__textField.getFieldElement().is(':focus')) {
                this.getElement().addClass('state_focus');
            }
            
            this.getElement().mousedown(_.debounce(function() {
                this.getFieldElement().focus();
            }.bind(this), 0));
        },
        
        /**
         * @private
         */
        __setUpSelectOrComboBox: function() {
            var fieldEl = this.getFieldElement();
            
            //excludes
            this.bind('excludes', this.__suggestion.getModel(), 'excludes');
            
            //choose item
            this.__suggestion.on('select', function(item) {
                item = this.__suggestion.getNormalizedItem(item);
                this.setValue(this.__isSelect ? item : item.text);
                //search string не сбрасывается для комбобокса
                this.__suggestion.getModel().setSearchString(null);
                
                if (this.__isSelect && this.getFieldElement().is(':focus')) {
                    this.getFieldElement().select();
                }
                
                if (croc.util.Browser.isIE('<9')) {
                    this.__suggestion.setOpenOnFocus(false);
                    this._getDisposer().setTimeout(function() {
                        this.__suggestion.setOpenOnFocus(true);
                    }.bind(this), 150);
                }
                
                //todo исправить это в новых компонентах
                this.__suggestion.close();
                this._getDisposer().defer(function() {
                    this.__suggestion.close();
                }, this);
            }, this);
            
            //подсвечиваем в саджесте текущее значение
            this.__suggestion.listenProperty('open', function(open) {
                if (open) {
                    var value = this.__isSelect ? this.getPlainValue() : this.__textField.getInstantValue();
                    if (value) {
                        var index = _.findIndex(this.__suggestion.getModel().getArray(),
                            function(item) {
                                return this.__suggestion.getNormalizedItem(item).value === value;
                            }, this);
                        this.__suggestion.getSelection().setSingleItemIndex(index);
                        if (this.__suggestion.getVisibleItemsManager()) {
                            this.__suggestion.getVisibleItemsManager().showItem(index);
                        }
                    }
                }
            }, this);
            
            if (this.__isSelect) {
                if (this.__enableFiltering) {
                    fieldEl.on({
                        blur: _.debounce(function() {
                            if (this.__suggestion.getModel().getLength() === 1) {
                                this.__suggestion.selectItem(this.__suggestion.getModel().getItem(0));
                            }
                        }.bind(this), 0)
                    });
                }
                else {
                    //Ставим фейковый инпут
                    var fakeFieldEl = this.isHtmlGenerated() ?
                        $('<div class="b-input-field-h"></div>').insertAfter(fieldEl) :
                        this.getElement().find('div.b-input-field-h');
                    this.__textField.bind('instantValue', croc.ui.Element.create(fakeFieldEl), 'text');
                    
                    fakeFieldEl.on('mousedown mouseup click', function(e) {
                        fieldEl.focus();
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
                
                //reset value
                this.__textField.on('changeInstantValue', function() {
                    if (!this.__textFieldInternalUpdate && this.getValue()) {
                        this.__dontSetTextFieldValue = true;
                        this.setValue(null);
                        this.__dontSetTextFieldValue = false;
                    }
                }, this);
            }
            else {
                //update value
                this.__textField.bind('value', this, 'value');
            }
        },
        
        /**
         * @private
         */
        __transformValue: function(value) {
            //нормализуем значение для селекта
            if (this.__isSelect && !this.__isMultiSelect && value && this.__suggestion) {
                var model = this.__suggestion.getModel();
                var array = model instanceof croc.data.MappedArray ? model.getOriginalArray() : model.getArray();
                for (var i = 0, curValue; curValue = array[i++];) { // jshint ignore:line
                    var normalized = this.__suggestion.getNormalizedItem(curValue);
                    if (croc.utils.objEqual(value, normalized)) {
                        return normalized;
                    }
                }
            }
            return value;
        },
        
        /**
         * @param {boolean} value
         * @private
         */
        __toggleTextField: function(value) {
            this.__textField.getFieldElement().css(croc.util.Browser.isIE('<=8') ? {
                width: value ? 'auto' : 0
            } : {
                position: value ? 'relative' : 'absolute',
                left: value ? 'auto' : -10000
            });
        }
    }
});

//noinspection JSHint
/**
 * @typedef {{text: String, value: String}}
 */
croc.ui.form.field.ComboBox.ValueType;
