/**
 * Подсказки для поля ввода (могут работать и без него)
 * todo сделать $$label независимым от scope
 */
croc.Class.define('croc.ui.form.suggestion.Default', {
    extend: croc.ui.list.View,
    implement: croc.ui.common.bubble.IBubble,
    include: croc.ui.common.bubble.MBubble,
    
    statics: {
        /**
         * Максимальное количество видимых одновременно элементов
         * @type {number}
         */
        MAX_VISIBLE_ITEMS_COUNT: Stm.env.ldevice === 'mobile' ? 5 : 10,
        
        /**
         * Минимальное количество видимых одновременно элементов
         * @type {number}
         */
        MIN_VISIBLE_ITEMS_COUNT: 3,
        
        /**
         * Коды ошибки сервера и сообщения к ним
         * @private
         * @static
         */
        __ERROR_CODES: {
            11: 'По запросу <b>{query}</b> ничего не найдено'
        },
        
        /**
         * @private
         * @static
         */
        __TEMPLATE_ITEM: '' +
        '<div class="b-suggestion-item{cls}" title="{title}">' +
        '   {text}' +
        '</div>'
    },
    
    events: {
        /**
         * @param {Object} item
         */
        select: null
    },
    
    properties: {
        /**
         * Не выделять текст после выбора
         * @type {boolean}
         */
        disableTextSelection: {
            field: '__disableTextSelection',
            value: false,
            option: true
        },
        
        /**
         * Отключить подсказки
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            apply: function(value) {
                if (!value) {
                    this.close();
                }
            },
            value: false,
            option: true
        },
        
        /**
         * Смещение по горизонтали относительно центра цели
         * @type {string}
         */
        hAlign: {
            inherit: true,
            value: 'left'
        },
        
        /**
         * Открывать саджест при фокусе поля
         * @type {boolean}
         */
        openOnFocus: {
            field: '__openOnFocus',
            value: true,
            option: true
        },
        
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            inherit: true,
            check: ['top', 'bottom'],
            value: 'bottom'
        },
        
        /**
         * Модификатор цвета
         * @type {string}
         */
        scheme: {
            cssClass: true,
            type: 'string',
            option: true
        },
        
        /**
         * Размеры подсказок. Если подсказки ассоциируются с полем и они не имеют собственных размеров, то размеры подсказок
         * становятся равными размерам поля.
         * @type {string}
         */
        size: {
            cssClass: true,
            type: 'string',
            option: true
        },
        
        /**
         * Показывать элементы, после фокуса на поле ввода даже если поле пустое
         * @type {boolean}
         */
        showUnfilteredOnFocus: {
            field: '__showUnfilteredOnFocus',
            value: false,
            option: true
        },
        
        /**
         * Нужно ли обновлять текстовое поле при выборе значения из подсказки
         * @type {boolean}
         */
        updateInputOnChooseItem: {
            field: '__updateInputOnChooseItem',
            value: true,
            option: true
        }
    },
    
    options: {
        /**
         * Подсказки закрываются при потере фокуса полем
         * @type {boolean}
         */
        closeOnBlur: true,
        
        /**
         * Автоматическое позиционирование bubble исходя из положения на экране
         * @type {boolean}
         */
        autoPositioning: true,
        
        /**
         * Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * @type {Array|Object}
         */
        autoPositioningSequence: ['top', 'bottom'],
        
        /**
         * Можно ли смещать элемент
         * @type {boolean}
         */
        autoShift: false,
        
        /**
         * Размер относительно размера target
         * @type {boolean}
         */
        autoSize: true,
        
        /**
         * Как устанавливается размер (minWidth, maxWidth или width)
         * @type {boolean}
         */
        autoSizeKind: 'min',
        
        /**
         * Убрать фокус с поля после выбора
         * @type {boolean}
         */
        blurOnSelect: Stm.env.device !== 'desktop',
        
        /**
         * Флаг, закрывать ли bubble на клик по документу
         * @type {boolean}
         */
        closeOnHtmlClick: true,
        
        /**
         * Запретить фильтрацию модели по значению текстового поля
         * @type {boolean}
         */
        disableFiltering: false,
        
        /**
         * Флаг, позиционировать ли bubble при ресайзе/скролле
         * @type {boolean}
         */
        dynamicPositioning: true,
        
        /**
         * Селектор блока с ошибкой
         * @type {string}
         */
        errorSelector: '.b-suggestion-error',
        
        /**
         * Поле ассоциированное с подсказаками. Подсказки могут существовать и без поля. Подсказки в любой момент можно
         * ассоциировать с полем вызвав initField.
         * @type {croc.ui.form.field.TextField}
         */
        field: null,
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<div class="b-suggestion g-scrollable{cls}">' +
        '   <div class="b-suggestion-container g-scrollable-h">' +
        '      <div class="b-suggestion-error" style="display: none"></div>' +
        '      <div class="b-suggestion-list">{items}</div>' +
        '      <div class="b-suggestion-more g-loader loader_small" style="display: none">&nbsp;</div>' +
        '   </div>' +
        '</div>',
        
        /**
         * модель данных для компонента
         * @type {croc.data.IObservableList}
         */
        model: null,
        
        /**
         * Селектор блока отображающего информацию о том, что можно подгрузить больше элементов из модели
         * @type {string}
         */
        moreItemsMarkerSelector: '.b-suggestion-more',
        
        /**
         * Приведение элемента списка к нормализованному виду
         * @type {function(*):{text: string, [$$label]: string, [$$icon]: Object, [value]: *, [title]: string}}
         */
        normalizeItemFn: function(item) { return typeof item === 'string' ? {text: item} : _.assign({}, item); },
        
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number}
         */
        offset: 2,
        
        /**
         * При первом получении фокуса если поле не пустое открывать подсказку
         * @type {boolean}
         */
        openSuggestionOnFirstFocus: true,
        
        /**
         * Нужно ли показывать строку с описанием ошибки при её возникновении
         * @type {Boolean}
         */
        showError: false,
        
        /**
         * Разрешить сабмит формы (пропуск enter наверх) если введён текст, но не выбран пункт из списка
         * @type {boolean}
         */
        submitRawText: false,
        
        /**
         * Нужно ли обновлять значение поля при передвижении по списку подсказок
         * @type {Boolean}
         */
        updateInputOnSelect: true,
        
        /**
         * Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * @type {Array.<number>}
         */
        screenGap: [5, 5, 5, 5]
    },
    
    construct: function(options) {
        if (!options.model) {
            options.model = this._createModel({});
        }
        else if (Array.isArray(options.model)) {
            options.model = new croc.data.ObservableArray({
                original: options.model
            });
        }
        
        croc.ui.form.suggestion.Default.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * Скрыть bubble
         * @param {boolean} [quick=false] закрыть без анимации
         */
        close: function(quick) {
            croc.ui.common.bubble.MBubble.prototype.close.apply(this, arguments);
            
            var model = this.getModel();
            if (croc.Interface.check(model, 'croc.data.IStreamList') && !model.getSearchString() &&
                model.getLength() > 0) {
                model.invalidateElements();
            }
        },
        
        /**
         * Запретить фильтрацию модели по значению текстового поля
         */
        disableFiltering: function() {
            this.__filteringDisabled = true;
            if (this.__filteringHandler) {
                this.__filteringHandler.remove();
                this.__filteringHandler = null;
            }
        },
        
        /**
         * Возвращает текстовое поле
         * @returns {croc.ui.form.field.TextField}
         */
        getField: function() {
            return this.__field;
        },
        
        /**
         * Получить нормализованные данные элемента
         * @param {Object} item
         */
        getNormalizedItem: function(item) {
            var store = croc.utils.objUserData(this, item);
            if (!store.item) {
                store.item = this.__normalizeItemFn(item);
                if (!('$$label' in store.item)) {
                    store.item.$$label = this._highlightItemLabel.bind(this, store.item, store.item.text);
                }
                if (!('value' in store.item)) {
                    store.item.value = store.item.text;
                }
            }
            
            return store.item;
        },
        
        /**
         * @param {croc.ui.form.field.TextField} field
         */
        initField: function(field) {
            if (this.__fieldInitialized) {
                throw new Error('Поле для подсказок уже инициализировано!');
            }
            
            if (!croc.Interface.check(this.getModel(), 'croc.data.ISearchableList')) {
                throw new Error('Подсказки для поля функционируют только с моделью,' +
                ' которая поддерживает интерфейс croc.data.ISearchableList');
            }
            
            this.__fieldInitialized = true;
            this.__field = field;
            if (!this.getSize()) {
                this.setSize(field.getSize());
            }
            
            //remove native autocomplete
            this.__field.getFieldElement().attr('autocomplete', 'off');
            
            if (!this.getTarget()) {
                this.setTarget(this.__field.getElement());
            }
            
            //запрещаем убирать фокус с поля
            if (Stm.env.device === 'desktop') {
                this.getElement().on('mousedown mouseup click', function(e) {
                    this.__setInternalFocus();
                    this.__field.focus();
                    this._getDisposer().setTimeout(function() {
                        this.__setInternalFocus();
                        this.__field.focus();
                    }.bind(this), 10);
                }.bind(this));
            }
            
            this.__bindToField();
            this.__setUpFieldEvents();
        },
        
        /**
         * Предотвратить открытие подсказки при фокусе поля
         */
        preventOpening: function() {
            this.__dirtyState = false;
            if (croc.Interface.check(this.getModel(), 'croc.data.IStreamList')) {
                this.getModel().invalidateElements(true);
            }
            this.close(true);
        },
        
        /**
         * Показать bubble. Если тултип был открыт, то возвращает true.
         * @returns {boolean}
         */
        open: function() {
            return !this.getDisabled() && croc.ui.common.bubble.MBubble.prototype.open.apply(this, arguments);
        },
        
        /**
         * Убирает "грязное" состояние саджеста. Это значит, что при следующем фокусе поля, его значение не будет
         * копироваться в свойство searchString модели
         */
        removeDirtyState: function() {
            this.__dirtyState = false;
        },
        
        /**
         * Пересчитать позицию
         */
        reposition: function() {
            if (this.__internalResize) {
                return;
            }
            var itemsManager = this.getVisibleItemsManager();
            if (!this.__internalItemsCountSetting && itemsManager) {
                this.__internalResize = true;
                itemsManager.setVisibleItemsCount(croc.ui.form.suggestion.Default.MAX_VISIBLE_ITEMS_COUNT);
                this.__internalResize = false;
            }
            croc.ui.common.bubble.MBubble.prototype.reposition.apply(this, arguments);
        },
        
        /**
         * Выбрать элемент из списка
         * @param {Object} item
         */
        selectItem: function(item) {
            this.close();
            this._onItemChosen(item);
            this.fireEvent('select', item);
        },
        
        /**
         * Показать список элементов без фильтрации
         */
        showItemsUnfiltered: function() {
            if (this.getDisabled()) {
                return;
            }
            var model = this.getModel();
            if (croc.Interface.check(model, 'croc.data.ISearchableList')) {
                model.setSearchString('');
            }
            if (croc.Interface.check(model, 'croc.data.IStreamList') && !model.isActualElements()) {
                model.prepareMore();
            }
            if (this.getListElements().length > 0) {
                this.open();
            }
        },
        
        /**
         * Создаёт модель
         * @param modelParams {Object}
         * @return {croc.ui.form.suggestion.model.Base}
         * @protected
         */
        _createModel: function(modelParams) {
            return new croc.ui.form.suggestion.model.Base(modelParams);
        },
        
        /**
         * Возращает разметку элемента списка. Чтобы клик по элементу внутри элемента списка не приводил к выбору
         * этого элемента списка, нужно указать первому класс js-suggestion-dont-select
         * @param item {Object}
         * @protected
         */
        _createItemHtml: function(item) {
            item = this.getNormalizedItem(item);
            var label = $.trim(typeof item.$$label === 'function' ? item.$$label() : item.$$label);
            return croc.ui.form.suggestion.Default.__TEMPLATE_ITEM.render({
                text: item.$$icon ? croc.ui.Render.icon(_.assign({text: label}, item.$$icon)) : label,
                title: item.title || ''
            });
        },
        
        /**
         * Ошибка появляется когда модель вернула ошибку
         * @param code
         * @param message
         * @returns {string}
         * @protected
         */
        _getErrorHtml: function(code, message) {
            var error = croc.ui.form.suggestion.Default.__ERROR_CODES[code];
            return error && error.render({
                    query: _.escape(this.getModel().getSearchString())
                });
        },
        
        /**
         * Обрамляет первое вхождение искомой строки в str в <strong></strong>
         * @param {Object} item
         * @param {String} str
         * @protected
         */
        _highlightItemLabel: function(item, str) {
            var label = croc.Interface.check(this.getModel(), 'croc.data.ISearchableList') ?
                croc.utils.strHighlightSubstring(str, this.getModel().getSearchString()) : str;
            return item.value === null ? '<span class="g-font color_gray">' + label + '</span>' : label;
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.suggestion.Default.superclass._initWidget.apply(this, arguments);
            
            if (this.__field) {
                this.initField(this.__field);
            }
            
            this.__setUpSuggestionsBehavior();
            this.__setUpOverflowing();
            
            //клик по маркерам приводит к клику по соответствующим элементам
            this.getElement().find('.g-scrollable-prev-marker').click(function() {
                this.getListItemElement(this.getVisibleItemsManager().getFirstVisibleItemIndex()).click();
            }.bind(this));
            this.getElement().find('.g-scrollable-next-marker').click(function() {
                this.getListItemElement(this.getVisibleItemsManager().getLastVisibleItemIndex()).click();
            }.bind(this));
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         * @private
         */
        _isClosingOnHtmlClickAllowed: function(targetEl) {
            return croc.ui.common.bubble.MBubble.prototype._isClosingOnHtmlClickAllowed.apply(this,
                    arguments) && !croc.utils.domIsElementOpenerOf(targetEl, this.getElement());
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
            
            if (this.__updateInputOnChooseItem) {
                this.__setValueIntarnally = true;
                this.__field.setValue(this.getNormalizedItem(item).text);
                this.__setValueIntarnally = false;
            }
            
            if (this.__blurOnSelect) {
                this.__field.blur();
            }
            else if (!this.__disableTextSelection) {
                this.__setInternalFocus();
                this.__field.getFieldElement().select();
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__field = options.field;
            this.__openSuggestionOnFirstFocus = options.openSuggestionOnFirstFocus;
            this.__updateInputOnSelect = options.updateInputOnSelect;
            this.__submitRawText = options.submitRawText;
            this.__closeOnBlur = options.closeOnBlur;
            this.__screenGap = options.screenGap;
            this.__blurOnSelect = options.blurOnSelect;
            
            if (options.disableFiltering) {
                this.__filteringDisabled = true;
            }
            
            if (!options.showError) {
                options.errorSelector = null;
            }
            
            this.__errorSelector = options.errorSelector;
            this.__normalizeItemFn = options.normalizeItemFn;
            
            options.listParams.itemRenderer = this._createItemHtml.bind(this);
            options.listParams.insertTo = '.b-suggestion-list';
            options.listParams.selectedItemClass = 'state_active';
            options.listParams.itemsSelector = '.b-suggestion-item';
            
            if (!options.renderBy && options.model &&
                (Array.isArray(options.model) ? options.model.length : options.model.getLength()) > 20 &&
                (!croc.Interface.check(options.model, 'croc.data.IStreamList'))) {
                options.renderBy = 20;
            }
            
            croc.ui.form.suggestion.Default.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (!this.isGrouped()) {
                this._setVisibleItemsManager(
                    this.__visibleItemsManager = new croc.ui.list.itemsManager.Scrolling({
                        visibleItemsCount: 10,
                        itemsBuffer: 10,
                        hasPrevNextMarker: true,
                        hidePrevNextMarkers: !croc.util.Browser.isIE() || croc.util.Browser.isIE('>9')
                    })
                );
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
            
            if (!this.__filteringDisabled) {
                this.__filteringHandler = this._getDisposer().addListener(this.__field, 'changeInstantValue',
                    function(value) {
                        if (!this.__setValueIntarnally) {
                            this.__dirtyState = false;
                            this.close(true);
                            this.getModel().setSearchString(value);
                        }
                    }.bind(this));
            }
            
            //обратный биндинг
            if (croc.Interface.check(this.getModel(), 'croc.data.IStreamList')) {
                this.getModel().listenProperty('loading', function(loading) {
                    if (loading && !this.getModel().isActualElements()) {
                        this.__field.setAction('loader', null);
                    }
                    else {
                        this.__field.resetAction();
                    }
                }, this);
            }
            
            this.getSelection().listenChanges(function() {
                if (this.__itemSelectingMethod === 'keydown' && this.getOpen()) {
                    if (this.__updateInputOnSelect) {
                        var selectedItem = this.getSelection().getFirstItem();
                        this.__setValueIntarnally = true;
                        if (selectedItem) {
                            this.__field.setValue(this.getNormalizedItem(selectedItem).text);
                        }
                        else {
                            this.__field.setValue(this.getModel().getSearchString());
                        }
                        this.__setValueIntarnally = false;
                    }
                }
            }, this);
        },
        
        /**
         * @param {boolean} down
         * @private
         */
        __keyMoveSelection: function(down) {
            var model = this.getModel();
            var index = this.getSelection().getFirstItemIndex();
            
            if (model.getLength() > 0) {
                index = index === -1 ?
                    (!down ? model.getLength() - 1 : 0) :
                    (!down ? index - 1 : index + 1);
                
                if (index >= model.getLength() && croc.Interface.check(model, 'croc.data.IStreamList') &&
                    model.getHasMoreItems()) {
                    index = model.getLength() - 1;
                }
                else if (index >= model.getLength() || index < -1) {
                    index = -1;
                }
                
                this.__itemSelectingMethod = 'keydown';
                this.getSelection().setSingleItemIndex(index);
                this.__itemSelectingMethod = null;
                
                //scrolling
                if (this.getVisibleItemsManager() && index !== -1) {
                    this.getVisibleItemsManager().showItem(index);
                }
            }
        },
        
        /**
         * @return {*}
         * @private
         */
        __onKeyNavigate: function(e) {
            var keyCode = e.keyCode;
            
            //noinspection FallthroughInSwitchStatementJS
            switch (keyCode) {
                //move selection
                case 38: /*UP*/
                case 40: /*DOWN*/
                    if (this.getOpen()) {
                        this.__keyMoveSelection(keyCode === 40);
                        
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    return false;
                
                case 13: /*ENTER*/
                    if (this.getSelection().getFirstItem()) {
                        this.selectItem(this.getSelection().getFirstItem());
                        e.preventDefault();
                    }
                    else if (!this.__submitRawText) {
                        e.preventDefault();
                    }
                    
                    return false;
                
                case 27: /*ESCAPE*/
                    if (this.__field && this.__field.getInstantValue()) {
                        this.__field.setValue(null);
                        e.stopPropagation();
                    }
                    this.close();
                    return false;
            }
            
            return true;
        },
        
        /**
         * @private
         */
        __setInternalFocus: function() {
            if (this.__internalFocusTimeout) {
                this.__internalFocusTimeout.remove();
            }
            
            this.__internalFocus = true;
            this.__internalFocusTimeout = this._getDisposer().setTimeout(function() {
                this.__internalFocus = false;
                this.__internalFocusTimeout = null;
            }.bind(this), 10);
        },
        
        /**
         * @private
         */
        __setUpFieldEvents: function() {
            var blurTimeout;
            var fieldEl = this.__field.getFieldElement();
            this._getDisposer().addListeners(this.__field.getFieldElement(), {
                keydown: function(e) {
                    this.__onKeyNavigate(e);
                }.bind(this),
                
                blur: function() {
                    if (Stm.env.device === 'desktop' && this.__closeOnBlur && !this.__isMouseOverSuggestions) {
                        blurTimeout = this._getDisposer().setTimeout(function() { this.close(); }.bind(this), 50);
                    }
                }.bind(this),
                
                'focus click': function() {
                    this._getDisposer().disposeItem(blurTimeout);
                    if (this.__openOnFocus && !this.getOpen() && !this.__internalFocus && !this.getDisabled()) {
                        setTimeout(function() {
                            if (!this.__openOnFocus || this.getOpen() || !fieldEl.is(':focus')) {
                                return;
                            }
                            
                            if (this.__openSuggestionOnFirstFocus && this.__dirtyState && this.__field.getValue()) {
                                this.getModel().setSearchString(this.__field.getValue());
                            }
                            if (this.getModel().getLength() > 0) {
                                this.open();
                            }
                            else if (this.__showUnfilteredOnFocus && !this.getModel().getSearchString()) {
                                this.showItemsUnfiltered();
                            }
                        }.bind(this), 100);
                    }
                }.bind(this)
            });
        },
        
        /**
         * @private
         */
        __setUpSuggestionsBehavior: function() {
            this.on('changeShown', function() {
                this.__isMouseOverSuggestions = false;
            }, this);
            
            this.getRenderModel().on('change', function() {
                this.reposition();
            }, this);
            
            //click by item
            this.on('listItemClick', function(item) {
                this.selectItem(this.getListItemModel(item));
                
                if (this.__field && !this.__blurOnSelect) {
                    this.__setInternalFocus();
                    this.__field.getFieldElement().focus();
                }
            }, this);
            
            //click by error
            this.getElement().find(this.__errorSelector).click(function() {
                this.close();
            }.bind(this));
            
            //mouseover mouseleave
            this.getElement().on('mouseover', '.b-suggestion-item', function(e) {
                this.__isMouseOverSuggestions = true;
                
                var goToSelectedChanged = false;
                if (this.__visibleItemsManager && this.__visibleItemsManager.getGoToSelectedItem()) {
                    this.__visibleItemsManager.setGoToSelectedItem(false);
                    goToSelectedChanged = true;
                }
                this.__itemSelectingMethod = 'mouseover';
                this.getSelection().setSingleItem(this.getListItemModel($(e.currentTarget)));
                this.__itemSelectingMethod = null;
                if (goToSelectedChanged) {
                    this.__visibleItemsManager.setGoToSelectedItem(true);
                }
            }.bind(this));
            
            this.getElement().mouseleave(function() {
                this.__isMouseOverSuggestions = false;
            }.bind(this));
            
            //если в саджесте остаётся один пункт - выделяем его
            this.getModel().listenChanges(function() {
                if (this.__field) {
                    this.setOpen(this.__field.getFieldElement().is(':focus') && this.getModel().getLength() > 0);
                }
                
                if (this.getModel().getLength() === 1) {
                    this.__itemSelectingMethod = 'internal';
                    this.getSelection().setSingleItemIndex(0);
                    this.__itemSelectingMethod = null;
                }
            }, this);
        },
        
        /**
         * @private
         */
        __setUpOverflowing: function() {
            if (!this.getVisibleItemsManager()) {
                return;
            }
            
            this.on('beforePositionApply', function(css, jointCss, prevent) {
                var firstItem = this.getListItemElement(0);
                if (!firstItem) {
                    return;
                }
                
                var manager = this.getVisibleItemsManager();
                var windowEl = $(window);
                var itemHeight = firstItem.outerHeight(true);
                
                if (typeof this.__screenGap === 'function') {
                    this.__screenGap = this.__screenGap(this);
                }
                
                var isBottomPosition = this.getCurrentPosition() === (this.getPositionInset() ? 'top' : 'bottom');
                var visibleHeight = isBottomPosition ?
                windowEl.innerHeight() - css.top - this.__screenGap[2] :
                css.top + this.getElement().height() - this.__screenGap[0];
                visibleHeight += (isBottomPosition ? -1 : 1) * this._adjustCoorsForScrolling(true).top;
                
                var visibleCount = croc.utils.numToRange(Math.floor(visibleHeight / itemHeight),
                    croc.ui.form.suggestion.Default.MIN_VISIBLE_ITEMS_COUNT,
                    croc.ui.form.suggestion.Default.MAX_VISIBLE_ITEMS_COUNT);
                var lastVisibleCount = manager.getVisibleItemsCount();
                
                if (lastVisibleCount !== visibleCount) {
                    this.__internalResize = true;
                    manager.setVisibleItemsCount(visibleCount);
                    this.__internalResize = false;
                    prevent();
                    this.__internalItemsCountSetting = true;
                    this.reposition();
                    this.__internalItemsCountSetting = false;
                }
            }, this);
        }
    }
});
