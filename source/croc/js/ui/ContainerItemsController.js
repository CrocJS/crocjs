/**
 * Контроллер для связи секции дочерних виджетов контейнера с моделью {@link croc.data.IObservableList}
 */
croc.Class.define('croc.ui.ContainerItemsController', {
    extend: croc.Object,
    
    statics: {
        /**
         * Функция вставляет новые элементы до элемента с селектором beforeElementSelector
         * Результат передаётся в качестве опции {@link croc.ui.ContainerItemsController.options.insertItemFn}
         * @param {jQuery|croc.ui.Widget} root
         * @param {string|jQuery} beforeElementSelector
         * @returns {Function}
         * @static
         */
        createInsertBeforeFn: function(root, beforeElementSelector) {
            var anchorElement;
            if (typeof beforeElementSelector !== 'string') {
                anchorElement = beforeElementSelector;
            }
            return function(element, beforeElement) {
                if (!anchorElement) {
                    anchorElement = (root instanceof jQuery ? root : root.getElement()).find(beforeElementSelector);
                }
                if (beforeElement) {
                    beforeElement.before(element);
                }
                else {
                    anchorElement.before(element);
                }
            };
        },
        
        /**
         * Функция вставляет новые элементы последними в контейнер с селектором containerSelector
         * Результат передаётся в качестве опции {@link croc.ui.ContainerItemsController.options.insertItemFn}
         * @param {jQuery|croc.ui.Container} root
         * @param {string|jQuery} containerSelector
         * @returns {Function}
         * @static
         */
        createInsertToContainerFn: function(root, containerSelector) {
            var container;
            if (typeof containerSelector !== 'string') {
                container = containerSelector;
            }
            return function(element, beforeElement) {
                if (!container) {
                    container = (root instanceof jQuery ? root : root.getElement()).find(containerSelector);
                }
                if (beforeElement) {
                    beforeElement.before(element);
                }
                else {
                    container.append(element);
                }
            };
        }
    },
    
    options: {
        /**
         * Контейнер (виджет)
         * @type {croc.ui.Container}
         */
        container: {
            required: true,
            type: 'croc.ui.Container'
        },
        
        /**
         * Критерий группировки элементов списка (ключ элемента списка или фукнция)
         * @type {string|function(*):*}
         */
        groupCriteria: null,
        
        /**
         * Функция либо шаблон для отображения заголовка группы
         * @type {string|function(*):string}
         */
        groupHeaderRenderer: null,
        
        /**
         * Функция вставки нового элемента
         * @type {function(jQuery, jQuery)}
         */
        insertItemFn: function(element, beforeElement) {
            if (beforeElement) {
                beforeElement.before(element);
            }
            else {
                this.__container.getElement().append(element);
            }
        },
        
        /**
         * Селектор контейнера для вставки элементов (передаётся вместо insertItemFn)
         * @type {string}
         */
        insertTo: {
            type: 'string'
        },
        
        /**
         * Функция либо шаблон для отображения элемента
         * @type {string|function(*):string}
         * @required
         */
        itemRenderer: null,
        
        /**
         * Селектор элементов дочерних виджетов. По-умолчанию insertTo + '>*'
         * @type {string}
         */
        itemsSelector: null,
        
        /**
         * Массив, элементы которого необходимо отображать
         * @type {croc.data.IObservableList|croc.data.IStreamList|Array}
         */
        model: null,
        
        /**
         * Вызывается когда виджет был отрисован
         * @type {function(croc.ui.Widget)}
         */
        onItemRendered: {
            type: 'function'
        },
        
        /**
         * Отключает режим оптимизированного рендеринга. В режиме оптимизированного рендеринга для элементов списка
         * не создаются виджеты, только dom-элементы
         * @type {boolean}
         */
        createWidgets: false,
        
        /**
         * Перерисовать элемент при изменении его модели
         * @type {boolean}
         */
        rerenderItemOnModelUpdate: true,
        
        /**
         * Функция восстанавливает элемент массива по DOM-элементу
         * @type {function(jQuery):*}
         */
        restoreItemFn: function(el) { throw 'not implemented!'; },
        
        /**
         * Секция дочерних виджетов
         * @type {string}
         */
        section: 'items',
        
        /**
         * Выделенные элементы будут получать указанный класс
         * @type {string}
         */
        selectedItemClass: null,
        
        /**
         * Функция трансформирующая элемент массива для передачи в {@link #itemRenderer}
         * @type {function(*):*}
         */
        renderDataFn: null
    },
    
    construct: function(options) {
        this.__container = options.container;
        this.__groupCriteria = options.groupCriteria;
        this.__groupHeaderRenderer = options.groupHeaderRenderer;
        this.__itemRenderer = options.itemRenderer;
        this.__restoreItemFn = options.restoreItemFn;
        this.__onItemRendered = options.onItemRendered;
        this.__section = options.section;
        this.__selectedItemClass = options.selectedItemClass;
        this.__transformItemFn = options.renderDataFn;
        this.__isOptimized = !options.createWidgets;
        this.__rerenderItemOnModelUpdate = options.rerenderItemOnModelUpdate;
        
        this.__itemsSelector = options.itemsSelector || ((options.insertTo || '') + '>*');
        
        this.__insertItemFn = options.insertTo ?
            croc.ui.ContainerItemsController.createInsertToContainerFn(this.__container, options.insertTo) :
            options.insertItemFn;
        
        this.__model = Array.isArray(options.model) ?
            new croc.data.ObservableArray({original: options.model}) :
            options.model;
        
        croc.ui.ContainerItemsController.superclass.construct.apply(this, arguments);
        
        if (this.__isOptimized && this.__groupCriteria) {
            throw new Error('not implemented!');
        }
        if (!this.__container.getElement() && this.__groupCriteria && this.__model.getArray() > 0) {
            throw new Error('not implemented!');
        }
    },
    
    members: {
        /**
         * Найти все элементы для дочерних виджетов
         * @param {jQuery} rootEl
         * @returns {jQuery}
         */
        findItemsElements: function(rootEl) {
            return rootEl.find(this.__itemsSelector);
        },
        
        /**
         * Генерирует html для переданных моделей
         * @param [models]
         * @param {function(string, Object|croc.ui.Widget):string} [wrapperFn]
         * @returns string
         */
        generateHtml: function(models, wrapperFn) {
            return (models || this.__model.getArray())
                .map(function(item) {
                    var html = this.__renderItemHtml(item);
                    if (wrapperFn) {
                        var wrapper = wrapperFn(this.__section, item);
                        if (wrapper !== '{item}') {
                            html = wrapper.render({item: html});
                        }
                    }
                    return html;
                }, this)
                .join('').trim()
                .replace(/\{cls\}/g, '');
        },
        
        /**
         * Сгенерировать виджет на основе dom-элемента
         * @param {jQuery} el
         * @returns {croc.ui.Widget}
         */
        generateWidgetByElement: function(el) {
            var item = el[0].$$model = this.__restoreItemFn(el);
            return this.__getItemWidget(item, el);
        },
        
        /**
         * Сгенерировать коллекцию виджетов на основе модели
         * @returns {Array.<croc.ui.Widget>}
         */
        generateWidgets: function() {
            return this.__model.getArray()
                .map(function(x, i) { return this.__getItemWidget(x); }, this);
        },
        
        /**
         * Получить все дочерние виджеты
         * @returns {Array.<croc.ui.Widget>}
         */
        getItems: function() {
            return this.__container.getItems(this.__section);
        },
        
        /**
         * Возвращает коллекцию всех dom-элементов списка
         * @returns {jQuery}
         */
        getListElements: function() {
            return $(this.__elements);
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
            if (param === undefined || param === null) {
                return null;
            }
            
            if (param instanceof croc.ui.Widget) {
                return param;
            }
            
            return croc.ui.Widget.getByElement(this.getListItemElement(param));
        },
        
        /**
         * Возвращает dom-элемент списка по параметру
         * @see #getListItem
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {jQuery}
         */
        getListItemElement: function(param) {
            if (param === undefined || param === null) {
                return null;
            }
            if (param instanceof croc.ui.Widget) {
                param = param.getWrapperElement();
            }
            if (param instanceof jQuery) {
                return param.closest('.js-list-item-' + this.getUniqueId());
            }
            
            param = this.getListItemIndex(param);
            var result = this.__elements[param];
            return result ? $(result) : null;
        },
        
        /**
         * Возвращает индекс элемента списка по параметру
         * @see #getListItem
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {Number}
         */
        getListItemIndex: function(param) {
            var isStream = croc.Interface.check(this.__model, 'croc.data.IStreamList');
            
            var index;
            if (typeof param === 'number') {
                index = param;
            }
            else {
                var model = this.getListItemModel(param);
                index = model ? this.__model.indexOf(model) : -1;
                if (model && index === -1 && isStream && this.__model.isSync()) {
                    index = this.__model.indexInStream(model);
                    if (index === null) {
                        index = -1;
                    }
                }
            }
            
            if (param !== -1 && isStream && this.__model.isSync()) {
                if (index === -1) {
                    while (this.__model.getHasMoreItems() && index === -1 && this.__model.isSync()) {
                        this.__model.prepareMore();
                        index = this.getListItemIndex(param);
                    }
                }
                else if (index >= this.__elements.length) {
                    var count = index - this.__model.getLength() + 1;
                    if (this.__model.getDefaultCount()) {
                        count = Math.ceil(count / this.__model.getDefaultCount()) * this.__model.getDefaultCount();
                    }
                    this.__model.prepareMore(count);
                }
            }
            
            return index;
        },
        
        /**
         * Возвращает модель элемента списка по параметру
         * @see #getListItem
         * @param {croc.ui.Widget|jQuery|number|Object} param
         * @returns {Object}
         */
        getListItemModel: function(param) {
            if (param === undefined || param === null) {
                return null;
            }
            
            if (typeof param === 'number' || param instanceof croc.ui.Widget || param instanceof jQuery) {
                param = this.getListItemElement(param);
            }
            else {
                return param;
            }
            
            if (!param) {
                return null;
            }
            
            return param.length ? param[0].$$model : undefined;
        },
        
        /**
         * Селектор dom-элементов списка
         * @returns {string}
         */
        getListItemsSelector: function() {
            return this.__itemsSelector;
        },
        
        /**
         * Массив элементов для отображения
         * @type {croc.data.IObservableList|croc.data.IStreamList}
         */
        getModel: function() {
            return this.__model;
        },
        
        /**
         * Коллекция выделенных элементов
         * @returns {croc.data.SelectionModel}
         */
        getSelection: function() {
            return this.__selection || (this.__selection = new croc.data.SelectionModel({list: this.__model}));
        },
        
        /**
         * Вставить дочерний элемент
         * @param {jQuery} element
         * @param {jQuery} beforeElement
         * @protected
         */
        insertItem: function(element, beforeElement) {
            this.__insertItemFn(element, beforeElement);
        },
        
        /**
         * Есть ли группировка элементов по критерию
         * @returns {boolean}
         */
        isGrouped: function() {
            return !!this.__groupCriteria;
        },
        
        /**
         * Работает ли список в оптимизированном режиме
         * @see croc.ui.ContainerItemsController.options.createWidgets
         * @returns {boolean}
         */
        isOptimized: function() {
            return this.__isOptimized;
        },
        
        /**
         * Уведомить о том что контейнер инициализирован
         */
        onInitWidget: function() {
            this.__elements = this.__container.getElement().find(this.__itemsSelector).get();
            var elementsReplaced = false;
            var modelLength = this.__model.getLength();
            
            if (!this.__container.isHtmlGenerated()) {
                if (modelLength === 0 || this.__elements.length !== modelLength) {
                    //restore from html
                    if (modelLength > 0) {
                        this.__elements = [];
                        this.__onChangeModel(0, [], this.__model.getArray());
                        elementsReplaced = true;
                    }
                    else if (this.__isOptimized) {
                        this.__model.replaceAll(this.__elements.map(function(el) {
                            return this.__restoreItemFn($(el));
                        }, this));
                    }
                    else {
                        this.__model.replaceAll(this.getItems().map(function(item) {
                            return item.getWrapperElement()[0].$$model;
                        }, this));
                    }
                }
            }
            else if (modelLength > 0 && !this.__elements.length) {
                this.__onChangeModel(0, [], this.__model.getArray());
                elementsReplaced = true;
            }
            
            //обработать уже отрисованные дочерние элементы
            if (!elementsReplaced && this.__elements.length > 0) {
                this.__processInsertedElements(this.__elements, this.__model.getArray(), [],
                    !this.isOptimized() && this.getItems());
            }
            
            //bindings
            this._getDisposer().addListener(this.__model, 'change', this.__onChangeModel, this);
            
            if (this.__rerenderItemOnModelUpdate) {
                this._getDisposer().addListener(this.__model, 'updateItem', function(item, index) {
                    this.rerenderItem(index);
                }, this);
            }
            
            this.__bindToListModel();
        },
        
        /**
         * Перерисовать элемент
         * @param {croc.ui.Widget|jQuery|number|Object} param
         */
        rerenderItem: function(param) {
            var index = this.getListItemIndex(param);
            if (this.isOptimized()) {
                this.getListItemElement(index).remove();
            }
            else {
                this.getListItem(index).destroy();
            }
            this.__elements.splice(index, 1);
            this.__onChangeModel(index, [], [this.__model.getItem(index)]);
        },
        
        /**
         * Поиск элементов DOM для всех дочерних элементов
         * @param {jQuery} el
         * @return {Object.<string, jQuery>}
         * @protected
         */
        _scanForItemsElements: function(el) {
            return {
                items: el.find(this.__itemsSelector)
            };
        },
        
        /**
         * @private
         */
        __bindToListModel: function() {
            if (this.__selectedItemClass) {
                this.getSelection().listenChanges(function(index, remove, insert) {
                    if (croc.utils.arrEqual(remove, insert)) {
                        return;
                    }
                    
                    remove.forEach(function(item) {
                        var el = this.getListItemElement(item);
                        if (el) {
                            el.removeClass(this.__selectedItemClass);
                        }
                    }, this);
                    insert.forEach(function(item) {
                        this.getListItemElement(item).addClass(this.__selectedItemClass);
                    }, this);
                }, this);
            }
        },
        
        /**
         * @returns {*}
         * @private
         */
        __getGroup: function(item) {
            return this.__groupCriteria === 'string' ? item[this.__groupCriteria] : this.__groupCriteria(item);
        },
        
        /**
         * @param item
         * @returns {croc.ui.Widget}
         * @private
         */
        __getHeaderWidget: function(item) {
            return new croc.ui.Widget({
                htmlTemplate: typeof this.__groupHeaderRenderer === 'function' ?
                    this.__groupHeaderRenderer(item) :
                    this.__groupHeaderRenderer.render(typeof item === 'object' ? item : {item: item})
            });
        },
        
        /**
         * @param {Object|jQuery} item
         * @param {jQuery} [el]
         * @returns {croc.ui.Widget}
         * @private
         */
        __getItemWidget: function(item, el) {
            var template = this.__renderItemHtml(item, el);
            return template instanceof croc.ui.Widget ? template : new croc.ui.Widget({
                htmlTemplate: el ? null : template,
                el: el || null
            });
        },
        
        /**
         * @private
         */
        __onChangeModel: function(index, remove, insert) {
            if (remove.length) {
                if (this.__isOptimized) {
                    $(this.__elements.slice(index, index + remove.length)).remove();
                }
                else if (this.__groupCriteria) {
                    if (this.__model.getLength() === 0) {
                        this.getItems().concat().forEach(function(x) { x.destroy(); });
                    }
                    else {
                        throw 'not implemented!';
                    }
                }
                else {
                    this.getItems().slice(index, index + remove.length)
                        .forEach(function(x) { x.destroy(); });
                }
                
                this.__elements.splice(index, remove.length);
            }
            
            if (insert.length) {
                var elements;
                var lastLength = this.__model.getLength() - insert.length;
                //нет гарантии что индекс элемента модели совпадает с индексом дочернего виджета
                //пока разрешаем группировку только для вставки элементов в конец списка
                if (this.__groupCriteria && index < lastLength) {
                    throw 'not implemented!';
                }
                
                if (this.__isOptimized) {
                    elements = $(this.generateHtml(insert));
                    this.insertItem(elements, index >= this.__elements.length ? null : this.getListItemElement(index));
                    elements = elements.get();
                    
                    this.__elements.splice.apply(this.__elements, [index, 0].concat(elements));
                    this.__processInsertedElements(elements, insert, []);
                }
                else {
                    var widgets;
                    var headers = {};
                    if (this.__groupCriteria) {
                        var group = lastLength > 0 && this.__getGroup(this.__model.getItem(lastLength - 1));
                        widgets = [];
                        insert.forEach(function(item, index) {
                            var curGroup = this.__getGroup(item);
                            if (group !== curGroup) {
                                headers[widgets.length] = true;
                                widgets.push(this.__getHeaderWidget(item));
                                group = curGroup;
                            }
                            widgets.push(this.__getItemWidget(item));
                        }, this);
                        this.__container.add(this.__section, widgets);
                    }
                    else {
                        widgets = insert.map(function(x) {return this.__getItemWidget(x);}, this);
                        this.__container.add(this.__section, widgets, this.getItems()[index]);
                    }
                    
                    elements = widgets.map(function(x) { return x.getWrapperElement()[0]; });
                    
                    var addElements = elements;
                    if (this.__groupCriteria) {
                        addElements = addElements.filter(function(element, index) {
                            return !headers[index];
                        });
                    }
                    this.__elements.splice.apply(this.__elements, [index, 0].concat(addElements));
                    
                    this.__processInsertedElements(elements, insert, headers, widgets);
                }
            }
        },
        
        /**
         * @param {Array.<Element>} elements
         * @param {Array.<Object>} models
         * @param headers
         * @param [widgets]
         * @private
         */
        __processInsertedElements: function(elements, models, headers, widgets) {
            for (var i = 0, modelId = 0; i < elements.length; ++i) {
                var el = elements[i];
                var model = models[modelId];
                
                if (headers[i]) {
                    el.$$header = true;
                    el.$$model = el.$$group = this.__getGroup(model);
                }
                else {
                    el.$$model = models[modelId];
                    if (this.__groupCriteria) {
                        el.$$group = this.__getGroup(model);
                    }
                    el = $(el);
                    el.addClass('js-list-item-' + this.getUniqueId());
                    
                    if (this.__onItemRendered) {
                        this.__onItemRendered(widgets ? widgets[i] : el);
                    }
                    
                    ++modelId;
                }
            }
            
            if (this.__selectedItemClass && this.getSelection().getLength() > 0) {
                this.getSelection().forEach(function(item) {
                    var el = this.getListItemElement(item);
                    if (el) {
                        el.addClass(this.__selectedItemClass);
                    }
                }, this);
            }
        },
        
        /**
         * @param item
         * @param [el]
         * @returns {*}
         * @private
         */
        __renderItemHtml: function(item, el) {
            if (el) {
                var widget = croc.ui.Widget.getByElement(el, true);
                if (widget) {
                    return widget;
                }
            }
            
            var renderData = this.__transformItemFn ? this.__transformItemFn(item) : item;
            return typeof this.__itemRenderer === 'function' ?
                this.__itemRenderer(renderData, el) :
                this.__itemRenderer.render(typeof renderData === 'object' ? renderData : {item: renderData});
        }
    }
});