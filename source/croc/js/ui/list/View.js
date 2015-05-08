/**
 * Представление динамического списка. Рендерит элементы IObservableList по определённым правилам.
 */
croc.Class.define('croc.ui.list.View', {
    extend: croc.ui.Container,
    
    events: {
        /**
         * Клик по элементу списка
         * @param {Object} model
         * @param {jQuery.Event} e
         */
        listItemClick: null
    },
    
    options: {
        /**
         * Вызывать всплывающий resize при изменении модели
         * @type {boolean}
         */
        bubbleResizeOnModelChange: false,
        
        /**
         * Селектор блока с ошибкой
         * @type {string}
         */
        errorSelector: null,
        
        /**
         * Скрывать весь виджет если модель пустая и показывать если появляются элементы
         * @type {boolean}
         */
        hideOnEmptyModel: false,
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '<div class="b-list-view{cls}">{items}</div>',
        
        /**
         * Враппер, в который оборачивается дочерний элемент
         * @type {function|string}
         */
        itemWrapper: {
            type: ['function', 'string']
        },
        
        /**
         * @see croc.ui.ContainerItemsController.options
         * @type {Object}
         */
        listParams: {
            value: {},
            extend: true
        },
        
        /**
         * Массив, элементы которого необходимо отображать
         * @type {croc.data.IObservableList|croc.data.IStreamList|Array}
         */
        model: null,
        
        /**
         * Селектор блока отображающего информацию о том, что можно подгрузить больше элементов из модели.
         * В данной реализации этот маркер считается за элемент списка!
         * @type {string}
         */
        moreItemsMarkerSelector: null,
        
        /**
         * Отображать элементы последовательно по n штук (используя {@link croc.data.StreamingProxy})
         */
        renderBy: {
            type: 'number'
        },
        
        /**
         * @type {Object}
         */
        streamingProxyConf: null,
        
        /**
         * Менеджер управляет видимостью элементов списка
         * @type {croc.ui.common.listView.AbstractVisibleItemsManager}
         */
        visibleItemsManager: null
    },
    
    destruct: function() {
        if (this.__visibleItemsManager) {
            this.__visibleItemsManager.dispose();
        }
        if (this.__renderModel && this.__renderModel !== this.__model) {
            this.__renderModel.dispose();
        }
    },
    
    members: {
        /**
         * Возвращает коллекцию всех dom-элементов списка
         * @returns {jQuery}
         */
        getListElements: function() {
            return this.__itemsController.getListElements();
        },
        
        /**
         * Возвращает виджет из списка, который соответствует переданному параметру. Значение параметра в зависимости от типа:
         * croc.ui.Widget - виджет элемента списка
         * jQuery - dom-элемент списка (либо его дочерний элемент любой глубины вложенности)
         * number - индекс элемента списка
         * Object - модель элемента списка (элемент массива, который является моделью списка)
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {croc.ui.Widget}
         */
        getListItem: function(param) {
            return this.__itemsController.getListItem(param);
        },
        
        /**
         * Возвращает dom-элемент списка по параметру
         * @see #getListItem
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {jQuery}
         */
        getListItemElement: function(param) {
            return this.__itemsController.getListItemElement(param);
        },
        
        /**
         * Возвращает индекс элемента списка по параметру
         * @see #getListItem
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {Number}
         */
        getListItemIndex: function(param) {
            return this.__itemsController.getListItemIndex(param);
        },
        
        /**
         * Возвращает модель элемента списка по параметру
         * @see #getListItem
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {Object}
         */
        getListItemModel: function(param) {
            return this.__itemsController.getListItemModel(param);
        },
        
        /**
         * Массив виджетов элементов списка
         * @returns {Array.<croc.ui.Widget>}
         */
        getListItems: function() {
            return this.__itemsController.getItems();
        },
        
        /**
         * Селектор dom-элементов списка
         * @returns {string}
         */
        getListItemsSelector: function() {
            return this.__itemsController.getListItemsSelector();
        },
        
        /**
         * Массив элементов для отображения
         * @type {croc.data.IObservableList|croc.data.IStreamList}
         */
        getModel: function() {
            return this.__model;
        },
        
        /**
         * Модель, элементы которой отрисовываются в список. Если не была передана опция renderBy, то совпадает с
         * переданной моделью.
         * @returns {croc.data.IObservableList}
         */
        getRenderModel: function() {
            return this.__renderModel;
        },
        
        /**
         * Коллекция выделенных элементов
         * @returns {croc.data.SelectionModel}
         */
        getSelection: function() {
            return this.__itemsController.getSelection();
        },
        
        /**
         * Менеджер управляющий видимостью элементов списка
         * @returns {croc.ui.common.listView.AbstractVisibleItemsManager}
         */
        getVisibleItemsManager: function() {
            return this.__visibleItemsManager;
        },
        
        /**
         * Есть ли группировка элементов по критерию
         * @returns {boolean}
         */
        isGrouped: function() {
            return this.__itemsController.isGrouped();
        },
        
        /**
         * Перерисовать элемент
         * @param {croc.ui.Widget|jQuery|number|Object} param
         */
        rerenderItem: function(param) {
            this.__itemsController.rerenderItem(param);
        },
        
        /**
         * Ошибка появляется когда модель вернула ошибку
         * @param code
         * @param message
         * @returns {string}
         * @protected
         */
        _getErrorHtml: function(code, message) {
            return message || code;
        },
        
        /**
         * Шаблон для обрамления дочернего элемента. Должен присутствовать маркер {item}. На обрамляющем элементе
         * должен быть класс js-wrapper.
         * @param {string} section
         * @param {croc.ui.Widget} item дочерний виджет
         * @returns {string}
         * @protected
         */
        _getItemWrapperTemplate: function(section, item) {
            return !this.__itemWrapper || section !== this.getDefaultItemsSection() ? '{item}' :
                typeof this.__itemWrapper === 'function' ? this.__itemWrapper(section, item) : this.__itemWrapper;
        },
        
        /**
         * Метод вызывается перед тем, как добавляется первый обработчик события
         * @param {string} event
         * @protected
         */
        _initEvent: function(event) {
            if (event === 'listItemClick') {
                if (this.getElement()) {
                    var listener = function(e) {
                        this.fireEvent('listItemClick', this.getListItemModel($(e.currentTarget)), e);
                    }.bind(this);
                    if (Stm.env.device !== 'desktop') {
                        croc.util.Mobile.delegate(this.getElement(), 'tap', this.getListItemsSelector(), listener);
                    }
                    else {
                        this.getElement().on('click', this.getListItemsSelector(), listener);
                    }
                }
                else {
                    this.once('changeRendered', function() {
                        this._initEvent(event);
                    }, this);
                }
            }
            else {
                croc.ui.list.View.superclass._initEvent.apply(this, arguments);
            }
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.list.View.superclass._initWidget.call(this);
            
            this.__errorEl = this.__errorSelector && this.getElement().find(this.__errorSelector);
            this.__moreItemsEl = this.__moreItemsMarkerSelector && this.getElement().find(this.__moreItemsMarkerSelector);
            
            //bindings
            this._getDisposer().addListener(this.__model, 'change', function() {
                if (this.__errorEl) {
                    this.__errorEl.hide();
                }
                if (this.__bubbleResizeOnModelChange) {
                    this.bubbleResize();
                }
                else {
                    this.onResize('modelChange');
                }
            }, this);
            
            if (this.__hideOnEmptyModel) {
                this._getDisposer().addBinding(this.__model, 'empty', this, 'shown', function(x) { return !x; });
            }
            
            var notItemsEl = this.getElement().find('.js-listview-noitems');
            var itemsEl = this.getElement().find('.js-listview-items');
            if (notItemsEl.length || itemsEl.length) {
                this._getDisposer().listenProperty(this.__model, 'empty', function(value) {
                    notItemsEl.toggle(value);
                    itemsEl.toggle(!value);
                }, this);
            }
            
            this.__bindToListModel();
            
            if (this.__visibleItemsManager) {
                if (this.__renderBy && !this.__visibleItemsManager.getItemsBuffer()) {
                    this.__visibleItemsManager.setItemsBuffer(Math.floor(this.__renderBy / 2));
                }
                this.__visibleItemsManager.initListView(this, !!this.__moreItemsEl);
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__renderBy = options.renderBy;
            this.__bubbleResizeOnModelChange = options.bubbleResizeOnModelChange;
            this.__itemWrapper = options.itemWrapper;
            
            croc.ui.list.View.superclass._onPropertiesInitialized.apply(this, arguments);
            
            /**
             * @type {croc.data.IObservableList|croc.data.IStreamList}
             * @private
             */
            this.__model = options.model || [];
            if (Array.isArray(this.__model)) {
                this.__model = new croc.data.ObservableArray({original: this.__model.concat()});
            }
            
            this.__renderModel = !options.renderBy ? this.__model :
                new croc.data.StreamingProxy(croc.Object.mergeConf({
                    original: this.__model,
                    limit: options.renderBy
                }, options.streamingProxyConf));
            
            /**
             * @type {croc.ui.ContainerItemsController}
             * @private
             */
            this.__itemsController = this.setItemsController(this.__renderModel, options.listParams);
            
            this.__errorSelector = options.errorSelector;
            this.__moreItemsMarkerSelector = options.moreItemsMarkerSelector;
            this.__hideOnEmptyModel = options.hideOnEmptyModel;
            
            if (options.visibleItemsManager) {
                this.__visibleItemsManager = options.visibleItemsManager;
            }
        },
        
        /**
         * Вызов возможен только до _initWidget
         * @param {croc.ui.list.itemsManager.Abstract} visibleItemsManager
         * @protected
         */
        _setVisibleItemsManager: function(visibleItemsManager) {
            this.__visibleItemsManager = visibleItemsManager;
        },
        
        /**
         * @private
         */
        __bindToListModel: function() {
            if (croc.Interface.check(this.__renderModel, 'croc.data.IStreamList')) {
                if (this.__errorEl) {
                    this.__renderModel.on('failure', function(code, message) {
                        var errorHtml = this._getErrorHtml(code, message);
                        if (errorHtml) {
                            this.__errorEl.html(errorHtml);
                            this.__errorEl.show();
                            this.setShown(true);
                        }
                    }, this);
                }
                
                if (this.__moreItemsEl) {
                    this.__renderModel.listenProperty('hasMoreItems', function(value) {
                        this.__moreItemsEl.toggle(value);
                    }, this);
                }
            }
        }
    }
});