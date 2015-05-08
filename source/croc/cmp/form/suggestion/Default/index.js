/**
 * Подсказки для поля ввода (могут работать и без него)
 * todo сделать $$label независимым от scope
 */
croc.Class.define('croc.cmp.form.suggestion.Default', {
    extend: croc.cmp.list.Bubble,
    
    events: {
        /**
         * @param {Object} item
         */
        choose: null
    },
    
    properties: {
        /**
         * Не выделять текст после выбора
         * @type {boolean}
         */
        disableTextSelection: {
            value: false,
            option: true
        },
        
        /**
         * Поле ассоциированное с подсказаками. Подсказки могут существовать и без поля. Подсказки в любой момент можно
         * ассоциировать с полем вызвав initField.
         * @type {croc.cmp.form.field.TextField}
         */
        field: {
            __setter: null,
            model: true
        },
        
        /**
         * Открывать саджест при фокусе поля
         * @type {boolean}
         */
        openOnFocus: {
            value: true,
            option: true
        },
        
        /**
         * Показывать элементы, после фокуса на поле ввода даже если поле пустое
         * @type {boolean}
         */
        showUnfilteredOnFocus: {
            value: false,
            option: true
        },
        
        /**
         * Нужно ли обновлять текстовое поле при выборе значения из подсказки
         * @type {string}
         */
        inputOnChoose: {
            check: ['update', 'empty'],
            value: 'update',
            option: true
        }
    },
    
    options: {
        /**
         * Размер относительно размера target
         * @type {boolean}
         */
        autoSize: true,
        
        /**
         * Как устанавливается размер (minWidth, maxWidth или width)
         * @type {string}
         */
        autoSizeKind: 'min',
        
        /**
         * Убрать фокус с поля после выбора
         * @type {boolean}
         */
        blurOnChoose: false,
        
        /**
         * Запретить фильтрацию модели по значению текстового поля
         * @type {boolean}
         */
        disableFiltering: false,
        
        initiallyEmpty: {},
        
        openCondition: {
            extend: true,
            value: {
                items: true,
                search: false
            }
        },
        
        /**
         * При первом получении фокуса если поле не пустое открывать подсказку
         * @type {boolean}
         */
        openSuggestionOnFirstFocus: true,
        
        /**
         * Функция, которая возвращает части элементов массива, по которым возможен поиск
         * @type {function(*):Array}
         */
        searchableItemPartsFn: {},
        
        /**
         * @type {Array}
         */
        selection: {
            value: []
        },
        
        /**
         * Разрешить сабмит формы (пропуск enter наверх) если введён текст, но не выбран пункт из списка
         * @type {boolean}
         */
        submitRawText: false,
        
        toggleByModel: true,
        
        /**
         * Нужно ли обновлять значение поля при передвижении по списку подсказок
         * @type {Boolean}
         */
        updateInputOnSelect: true
    },
    
    members: {
        /**
         * Выбрать элемент из списка
         * @param {Object} item
         */
        chooseItem: function(item) {
            this.close();
            this._onItemChosen(item);
            this.fireEvent('choose', item);
        },
        
        /**
         * Скрыть bubble
         * @param {boolean} [quick=false] закрыть без анимации
         */
        close: function(quick) {
            croc.cmp.form.suggestion.Default.superclass.close.apply(this, arguments);
            
            if (this.__stream && !this.__searchable.getSearchString() && this.__stream.getLength() > 0) {
                this.__stream.invalidateElements();
            }
        },
        
        /**
         * Запретить фильтрацию модели по значению текстового поля
         */
        disableFiltering: function() {
            this._options.disableFiltering = true;
            if (this.__filteringHandler) {
                this.__filteringHandler.remove();
                this.__filteringHandler = null;
            }
        },
        
        /**
         * @returns {croc.data.chain.ISearch}
         */
        getSearchableModel: function() {
            return this.__searchable;
        },
        
        getSelection: function() {
            return this._model.at('selection');
        },
        
        /**
         * @param {croc.cmp.form.field.TextField} field
         */
        initField: function(field) {
            if (this.__fieldInitialized) {
                throw new Error('Поле для подсказок уже инициализировано!');
            }
            
            this.__fieldInitialized = true;
            this.__field = field;
            if (!this.getSize()) {
                this.setSize(field.getSize());
            }
            this.__bindToField();
            
            this.__setField(field);
        },
        
        /**
         * @param {boolean} down
         */
        moveSelection: function(down) {
            var model = this.getModel();
            var index = this.getListManager().getItemIndex(this._options.selectedItem);
            
            if (model.getLength() > 0) {
                index = index === -1 ?
                    (!down ? model.getLength() - 1 : 0) :
                    (!down ? index - 1 : index + 1);
                
                if (index >= model.getLength() && this.__promise && this.__promise.getHasMoreItems()) {
                    index = model.getLength() - 1;
                }
                else if (index >= model.getLength() || index < -1) {
                    index = -1;
                }
                
                this._model.set('selectedItem', model.getItems()[index]);
                
                //scrolling
                if (index !== -1) {
                    this.getListManager().showItem(index);
                }
            }
        },
        
        /**
         * Предотвратить открытие подсказки при фокусе поля
         */
        preventOpening: function() {
            this.__dirtyState = false;
            if (this.__stream) {
                this.__stream.invalidateElements(true);
            }
            this.close(true);
        },
        
        /**
         * Убирает "грязное" состояние саджеста. Это значит, что при следующем фокусе поля, его значение не будет
         * копироваться в свойство searchString модели
         */
        removeDirtyState: function() {
            this.__dirtyState = false;
        },
        
        /**
         * Показать список элементов без фильтрации
         */
        showItemsUnfiltered: function() {
            if (this.__searchable) {
                this.__searchable.setSearchString('');
            }
            if (this.__stream && !this.__stream.isActualElements()) {
                this.__stream.needMore();
            }
            this.open();
        },
        
        ///**
        // * Ошибка появляется когда модель вернула ошибку
        // * @param code
        // * @param message
        // * @returns {string}
        // * @protected
        // */
        //_getErrorHtml: function(code, message) {
        //    var error = croc.cmp.form.suggestion.Default.__ERROR_CODES[code];
        //    return error && error.render({
        //            query: _.escape(this.getModel().getSearchString())
        //        });
        //},
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            var searchOptions = {initiallyEmpty: this._options.initiallyEmpty};
            if (this._options.searchableItemPartsFn) {
                searchOptions.searchableItemPartsFn = this._options.searchableItemPartsFn;
            }
            var lookupResult = croc.data.chain.From.resolve(this._model.at('model'))
                .lookupOrChain(croc.data.chain.ISearch, croc.data.chain.Search, searchOptions);
            
            this.__searchable = lookupResult.needle;
            croc.data.Helper.bind(this.__searchable, 'searchString', this._model, 'searchString');
            
            this._options._managerAddConf = {
                model: lookupResult.chain,
                selection: this._model.at('selection')
            };
            
            this._options.goToSelectedItem = true;
            
            croc.cmp.form.suggestion.Default.superclass._initModel.apply(this, arguments);
            
            this.__stream = this.getModel().lookup(croc.data.chain.IStream);
            this.__promise = this.getModel().lookup(croc.data.chain.IPromise);
            
            this.getModel().on('change', function(items) {
                if (items.length === 1) {
                    this._options.itemSelectingMethod = 'internal';
                    this._model.set('selectedItem', items[0]);
                    delete this._options.itemSelectingMethod;
                }
                else if (this._options.selectedItem && !_.contains(items, this._options.selectedItem)) {
                    this._model.del('selectedItem');
                }
            }, this);
            
            this._model.checkItem('$$selected', 'selectedItem', 'items');
            
            this.__searchable.on('changeSearchString', function(value) {
                if (value) {
                    this.open();
                }
                else if (!this._isOpenAllowed()) {
                    this.close();
                }
            }, this);
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.suggestion.Default.superclass._initWidget.apply(this, arguments);
            
            if (this._options.field) {
                this.initField(this._options.field);
            }
            
            this._model.on('change', 'selectedItem', this.debounce(function(item) {
                if (item && this._options.goToSelectedItem) {
                    this.getListManager().showItem();
                }
            }, this));
            
            //this.__setUpOverflowing();
        },
        
        _isOpenAllowed: function() {
            var cond = this._options.openCondition;
            return (!cond.model || this.getModel().getLength() > 0) && (!cond.search || !!this.__searchable.getSearchString());
        },
        
        /**
         * Обработать выбор элемента
         * @param item {Object}
         * @private
         */
        _onItemChosen: function(item) {
            if (!this.__field) {
                return;
            }
            
            var inputOnChoose = this.getInputOnChoose();
            if (inputOnChoose) {
                this.__setValueIntarnally = inputOnChoose === 'update';
                this.__field.setValue(inputOnChoose === 'update' ? this.normalizeItem(item).text : '');
                this.__setValueIntarnally = false;
            }
        },
        
        /**
         * @private
         */
        __bindToField: function() {
            //прямой биндинг
            if (this.__field.getValue()) {
                this.__dirtyState = true;
            }
            
            if (!this._options.disableFiltering) {
                this.__filteringHandler = this._getDisposer().addListener(this.__field, 'changeInstantValue',
                    function(value) {
                        if (!this.__setValueIntarnally) {
                            this.__dirtyState = false;
                            //this.close(true);
                            this.__searchable.setSearchString(value);
                        }
                    }.bind(this));
            }
            
            //обратный биндинг
            if (this.__stream) {
                this.__stream.bind('loading', this.__field, 'action', function(x) { return x ? 'loader' : null; });
            }
            
            var selectionListener = function() {
                if (this._options.itemSelectingMethod === 'keydown' && this.getOpen()) {
                    if (this._options.updateInputOnSelect) {
                        var selectedItem = this._options.selection[0];
                        this.__setValueIntarnally = true;
                        if (selectedItem) {
                            this.__field.setValue(this.normalizeItem(selectedItem).text);
                        }
                        else {
                            this.__field.setValue(this.__searchable.getSearchString());
                        }
                        this.__setValueIntarnally = false;
                    }
                }
            }.bind(this);
            
            this._model.on('all', 'selection', selectionListener);
            selectionListener();
        }
        
        ///**
        // * @private
        // */
        //__setUpOverflowing: function() {
        //    if (!this.getVisibleItemsManager()) {
        //        return;
        //    }
        //    
        //    this.on('beforePositionApply', function(css, jointCss, prevent) {
        //        var firstItem = this.getListItemElement(0);
        //        if (!firstItem) {
        //            return;
        //        }
        //        
        //        var manager = this.getVisibleItemsManager();
        //        var windowEl = $(window);
        //        var itemHeight = firstItem.outerHeight(true);
        //        
        //        if (typeof this.__screenGap === 'function') {
        //            this.__screenGap = this.__screenGap(this);
        //        }
        //        
        //        var visibleHeight = this.getCurrentPosition() === 'bottom' ?
        //        windowEl.scrollTop() + windowEl.height() - css.top - this.__screenGap[2] :
        //        css.top + this.getElement().height() - windowEl.scrollTop() - this.__screenGap[0];
        //        
        //        var visibleCount = croc.utils.numToRange(Math.floor(visibleHeight / itemHeight),
        //            croc.cmp.form.suggestion.Default.MIN_VISIBLE_ITEMS_COUNT,
        //            croc.cmp.form.suggestion.Default.MAX_VISIBLE_ITEMS_COUNT);
        //        var lastVisibleCount = manager.getVisibleItemsCount();
        //        
        //        manager.setVisibleItemsCount(visibleCount);
        //        if (lastVisibleCount !== visibleCount) {
        //            prevent();
        //            this.reposition();
        //        }
        //    }, this);
        //}
    }
});
