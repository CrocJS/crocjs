/**
 * Combobox
 */
croc.Class.define('croc.cmp.form.field.ComboBox', {
    extend: croc.cmp.form.field.AbstractFieldWrapper,
    implement: [
        croc.cmp.form.field.IDisable,
        croc.cmp.form.field.ISizable,
        croc.cmp.form.field.ITextField
    ],
    include: [
        croc.cmp.form.field.MDisableFieldWrapper,
        croc.cmp.form.field.MSizableFieldWrapper,
        croc.cmp.form.field.MTextFieldWrapper
    ],
    
    properties: {
        /**
         * Разрешено ли добавление/выбор новых значений
         * @type {boolean}
         */
        addingValues: {
            value: true,
            model: true
        },
        
        /**
         * Разрешить фильтрацию по значениям списка
         * В режимах {@link #mode} 'select', 'multiselect' поле поиска просто исчезает
         * в режиме 'default' текстовое поле остаётся, но фильтрация по значениям не происходит
         * @type {boolean}
         */
        enableFiltering: {
            value: true,
            getter: null,
            __setter: null,
            model: true
        },
        
        /**
         * Массив элементов, которые следует исключить из подсказки
         * @type {Array}
         */
        excludes: {
            type: 'array',
            value: [],
            model: true
        },
        
        /**
         * Режим работы компонента
         * @type {string}
         */
        mode: {
            check: ['default', 'select', 'multiselect'],
            value: 'default',
            getter: null,
            __setter: null,
            model: true
        },
        
        /**
         * Плэйсхолдер для поля. Только для режимов default и select
         * @type {string}
         */
        placeholder: {
            type: 'string',
            model: true
        },
        
        plainValue: {
            model: true
        },
        
        /**
         * Значение поля
         * @type {Array.<croc.cmp.form.field.ComboBox.ValueType>|croc.cmp.form.field.ComboBox.ValueType|string}
         */
        value: {
            type: ['array', 'object', 'string'],
            value: null,
            transform: '__transformValue',
            model: true
        }
    },
    
    options: {
        /**
         * Показывать кнопку "добавить"
         * @type {boolean}
         */
        addButton: {},
        
        /**
         * Опции для работы по типу селекта
         * @type {Array.<croc.cmp.form.field.ComboBox.ValueType|string>}
         */
        options: {
            type: 'array'
        },
        
        /**
         * Подсказка для поля поиска
         * @type {croc.cmp.form.suggestion.Suggestion}
         */
        suggestion: null,
        
        /**
         * Конфиг для текстового поля
         * @type {Object}
         */
        textFieldConf: {
            extend: true,
            value: {}
        }
    },
    
    construct: function() {
        croc.cmp.form.field.ComboBox.superclass.construct.apply(this, arguments);
        this._addExtendingWrapperOptions('placeholder');
        this._removeExtendingWrapperOptions('value');
    },
    
    members: {
        /**
         * Подсказка к полю
         * @returns {croc.cmp.form.suggestion.Default}
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
            return this.isEmpty() && (!this._wrapped || this._wrapped.isEmpty());
        },
        
        /**
         * Открыть подсказки
         */
        openSuggestion: function() {
            var suggestion = this.__suggestion;
            if (!suggestion.getSearchableModel().getSearchString()) {
                this.__suggestion.showItemsUnfiltered();
                this._wrapped.focus();
            }
            else if (suggestion.getModel().getLength() > 0) {
                suggestion.open();
                this._wrapped.focus();
            }
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.ComboBox.superclass._initModel.apply(this, arguments);
            
            this._options.multiselect = this.__isMultiSelect = this._options.mode === 'multiselect';
            this._options.select = this.__isSelect = this._options.mode !== 'default';
            this._options.initialAddButton = this.__initialAddButton = !!this._options.addButton;
            this._options.initialEnableFiltering = this.__initialEnableFiltering = !!this._options.enableFiltering;
            
            this.__initSuggestion();
            this.__setUpPlainValue();
            this.__setTextFieldDefaults();
            
            this.listenProperty('addingValues', this.__applyAddingValues, this);
            
            if (this.__isMultiSelect) {
                this.__initMultiSelect();
            }
            else {
                this.__suggestion.on('choose', function(item) {
                    item = this.__suggestion.normalizeItem(item);
                    this.setValue(this.__isSelect ? item : item.text);
                    //search string doesn't reset for combobox
                    this.__suggestion.getSearchableModel().setSearchString(null);
                }, this);
            }
            
            this.on('changeFocused', function(value) {
                if (!value) {
                    this._model.del('selectedItem');
                }
            }, this);
            
            this.on('changeDisabled', function(value) {
                this.__suggestion.close(true);
                this._model.del('selectedItem');
            }, this);
            
            var model = this.__suggestion.getModel();
            if (!model.lookup(croc.data.chain.IStream)) {
                var searchableModel = this.__suggestion.getSearchableModel();
                
                //reset model on close
                this.__suggestion.on('close', function() {
                    searchableModel.setSearchString(null);
                }, this);
                
                //reset search string on empty model
                var onModelChange = function() {
                    if (model.getLength() === 0 && searchableModel.getSearchString()) {
                        searchableModel.setSearchString(null);
                    }
                };
                model.on('change', onModelChange);
                onModelChange();
            }
            
            this.onWrapped(function(item) {
                this.bind('enableFiltering', item, 'readOnly', function(x) { return !x; });
                this.listenProperty('value', this.__applyValue, this);
                
                if (!this.__isMultiSelect) {
                    if (this.__isSelect) {
                        //reset value
                        item.on('changeInstantValue', function(value, old, internal) {
                            if (this.getValue() && (!internal || !internal.wrappedInternalUpdate)) {
                                this.setValue(null, {dontSetTextFieldValue: true});
                            }
                        }, this);
                    }
                    else {
                        item.bind('value', this, 'value');
                    }
                }
                
                this.__suggestion.initField(item);
            }, this);
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.field.ComboBox.superclass._initWidget.apply(this, arguments);
            this.__suggestion.setTarget(this.getElement());
        },
    
        /**
         * @param value
         * @param old
         * @param internal
         * @private
         */
        __applyValue: function(value, old, internal) {
            if (value && (
                (!this.__isSelect && typeof value !== 'string') ||
                (this.__isMultiSelect && !Array.isArray(value)) ||
                (!this.__isMultiSelect && Array.isArray(value))
                )) {
                throw new TypeError('Тип переданного значения некорректен!');
            }
            
            if (!this.__isMultiSelect) {
                if (this._wrapped && (!internal || !internal.dontSetTextFieldValue)) {
                    this._wrapped.setValue(this.__isSelect && value ? value.text : value,
                        {wrappedInternalUpdate: true, keepSearchString: this.__isSelect});
                    
                    if (this.__isSelect) {
                        this.__suggestion.getSearchableModel().setSearchString(null);
                    }
                }
            }
        },
        
        /**
         * @param value
         * @private
         */
        __applyAddingValues: function(value) {
            if (value) {
                this._model.set('addButton', this.__initialAddButton);
                this._model.set('enableFiltering', this.__initialEnableFiltering);
                if (this.__suggestion && this.__addingValuesSuggestion !== undefined) {
                    this.__suggestion.setDisableOpening(this.__addingValuesSuggestion);
                }
            }
            else {
                this._model.set('addButton', false);
                this._model.set('enableFiltering', false);
                this.__addingValuesSuggestion = this.__suggestion ? !!this.__suggestion.getDisableOpening() : undefined;
                if (this.__suggestion) {
                    this.__suggestion.setDisableOpening(true);
                }
            }
        },
        
        /**
         * @returns {Array.<Object>}
         * @private
         */
        __getSourceItems: function() {
            var searchable = this.__suggestion.getSearchableModel();
            var model = searchable.lookup(croc.data.chain.IList, true) || searchable;
            return model.getItems().map(function(x) { return this.__suggestion.normalizeItem(x); }, this);
        },
        
        /**
         * @private
         */
        __initMultiSelect: function() {
            var model = this.__suggestion.getSearchableModel();
            var setModelExcludes = function() {
                model.setExcludes((this.getValue() || []).concat(this.getExcludes() || []));
            }.bind(this);
            this.on('changeValue', setModelExcludes);
            this._model.on('excludes', 'all', setModelExcludes);
            setModelExcludes();
            
            //add item
            this.__suggestion.on('choose', function(item) {
                var normalized = this.__suggestion.normalizeItem(item);
                this.setValue((this.getValue() || []).concat(normalized));
                this._model.set('selectedItem', normalized);
                this._wrapped.setValue('');
                this.__suggestion.preventOpening();
            }, this);
        },
        
        /**
         * @private
         */
        __initSuggestion: function() {
            this.__suggestion = this._options.suggestion;
            if (!this.__suggestion) {
                this.__suggestion = new croc.cmp.form.suggestion.Suggestion({
                    model: new croc.data.chain.Map({
                        source: croc.data.chain.From.resolve(this._model.at('options')),
                        mapper: function(items) {
                            return items.map(function(x) {
                                return typeof x === 'object' ? x : {text: x, value: x};
                            });
                        }
                    })
                });
            }
            this.__suggestion.render(this, true);
            this.__suggestion.setDisableTextSelection(true);
            this.__suggestion.setShowUnfilteredOnFocus(true);
            this.__suggestion.setInputOnChoose(null);
            this.__suggestion.removeDirtyState();
        },
        
        /**
         * @private
         */
        __setTextFieldDefaults: function() {
            this._options.defaults.wrapped = _.assign({
                selectionBehavior: this.__isSelect && !this.__isMultiSelect ? 'selectOnFocus' : null,
                value: (this.__isMultiSelect || !this.getValue() ? null :
                    this.__isSelect ? this.getValue().text : this.getValue()) || '',
                showReset: false,
                cssType: 'combobox',
                manageFocus: !this.__isMultiSelect,
                mobileScrollTop: true
            }, this._options.textFieldConf);
        },
        
        /**
         * @private
         */
        __setUpPlainValue: function() {
            croc.Object.twoWaysBinding(this, 'value', this, 'plainValue',
                function(value) {
                    value = (value && (!this.__isSelect ? value :
                        this.__isMultiSelect ? _.pluck(value, 'value') : value.value)) || null;
                    if (this.__isMultiSelect && croc.utils.arrEqual(value, this._options.plainValue)) {
                        value = this._options.plainValue;
                    }
                    return value;
                },
                function(value) {
                    if (value === null || !this.__isSelect) {
                        return value;
                    }
                    
                    if (!this.__isMultiSelect) {
                        value = [value];
                    }
                    
                    var sourceItems = this.__getSourceItems();
                    value = value.map(function(val) {
                        var found = _.find(sourceItems, function(item) {
                            return item.value === val;
                        });
                        if (!found) {
                            throw new Error('Can\'t find a complex value for the passed plain one: ' + value);
                        }
                        return found;
                    });
                    
                    return this.__isMultiSelect ? value : value[0];
                }, this, !!this._options.plainValue);
        },
        
        /**
         * @private
         */
        __transformValue: function(value) {
            //нормализуем значение для селекта
            if (this.__isSelect && !this.__isMultiSelect && value && this.__suggestion) {
                var array = this.__getSourceItems();
                for (var i = 0, curValue; curValue = array[i++];) { // jshint ignore:line
                    if (croc.utils.objEqual(value, curValue)) {
                        return curValue;
                    }
                }
            }
            return value;
        }
    }
});
