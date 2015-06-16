/**
 * Виджет, который может быть контейнером для дочерних виджетов
 * meta-данные дочерних виджетов:
 * noWrap: не оборачивать разметку виджета
 */
croc.Class.define('croc.ui.Container', {
    extend: croc.ui.Widget,
    
    events: {
        /**
         * добавление нового элемента, подписавшись на это событие
         * можно изменить meta-данные виджета
         * @param {croc.ui.Widget} item
         * @param {Object} meta
         */
        beforeAddItem: null,
        
        /**
         * Новый дочерний элемент был добавлен
         * @param {croc.ui.Widget} item
         */
        itemAdded: null,
        
        /**
         * @param {croc.ui.Widget} item
         */
        removeItem: null
    },
    
    options: {
        /**
         * Автоматически сканировать DOM на предмет дочерних виджетов
         * @type {boolean}
         */
        autoScan: {
            type: 'boolean'
        },
        
        /**
         * алиас к itemsDefaults[defSection], где defSection - секция по-умолчанию
         * @type {Object}
         */
        dItemDefaults: {
            extend: true
        },
        
        /**
         * Конфигурация по-умолчанию добавляемая к items
         * @type {Object.<string, object>|object}
         */
        itemDefaults: {
            value: {},
            deepExtend: true
        },
        
        /**
         * Список дочерних виджетов (или их описаний)
         * @type {object|croc.ui.Widget|Array.<object|croc.ui.Widget>|Object.<string, object|croc.ui.Widget|Array.<object|croc.ui.Widget>>}
         */
        items: null,
        
        /**
         * Если true то полагается на идентификаторы дочерних виджетов, а не на порядок их следования в секции
         * при связывании дочерних виджетов с найденными элементами
         * @type {boolean}
         * @protected
         */
        _useChildrenIdentifiers: true,
        
        /**
         * Если контейнер является враппером над одним виджетом без внешнего html. Если передано true,
         * то считается что оборачивается секция по умолчанию, иначе должна быть передана оборачиваемая
         * секция.
         * @type {string|boolean}
         */
        _wrapSection: {}
    },
    
    construct: function(options) {
        this.__items = {};
        this.__itemsControllers = {};
        this.__itemsHash = {};
        this.__independentItems = {};
        this.__useChildrenIdentifiers = options._useChildrenIdentifiers;
        this.__wrapSection = options._wrapSection === true ? this.getDefaultItemsSection() : options._wrapSection;
        
        if (!options.items) {
            options.items = {};
        }
        
        croc.ui.Container.superclass.construct.apply(this, arguments);
    },
    
    destruct: function() {
        _.forOwn(this.__items, function(items) {
            items.forEach(function(x) { x.dispose(); });
        });
        _.forOwn(this.__itemsControllers, function(controller) {
            controller.dispose();
        });
    },
    
    members: {
        /**
         * Добавить новый дочерний виджет
         * @param {string|croc.ui.Widget|object|jQuery|Array.<croc.ui.Widget|object|jQuery>} [section=null] опустить для секции по-умолчанию
         * @param {croc.ui.Widget|object|jQuery|Array.<croc.ui.Widget|object|jQuery>} [items]
         * @param {croc.ui.Widget} [beforeItem=undefined] вставить элемент до переданного
         * @return {Array.<croc.ui.Widget>}
         */
        add: function(section, items, beforeItem) {
            
            if (typeof section !== 'string') {
                beforeItem = items;
                items = section;
                section = this.getDefaultItemsSection();
            }
            
            if (typeof beforeItem === 'number') {
                beforeItem = this.getItems(section)[beforeItem];
            }
            
            if (!Array.isArray(items)) {
                items = [items];
            }
            
            items = items.map(function(item) {
                //если виджет передан как плоский объект либо элемент
                if (!(item instanceof croc.ui.Widget)) {
                    if (item instanceof jQuery) {
                        item = {el: item};
                    }
                    if (!item.xtype && item.el) {
                        item = _.assign({}, item);
                        var addConf = this._getConfByElement(section, item.el);
                        if (addConf && !(addConf instanceof croc.ui.Widget)) {
                            _.assign(item, addConf);
                        }
                    }
                    item = this.__getItemConf(section, item, item.el);
                    var type = croc.ui.WidgetsManager.getInstance().getWidgetType(item.xtype);
                    return new type(item);
                }
                else {
                    item._setParentWidgetAndSection(this, section);
                    return item;
                }
            }, this);
            
            var itemsArray = this.__items[section] || (this.__items[section] = []);
            itemsArray.splice.apply(itemsArray,
                [beforeItem ? itemsArray.indexOf(beforeItem) : itemsArray.length, 0].concat(items));
            
            var addItemsHtml = function(items) {
                var childClass = this.__getChildClass(section);
                var itemsHtmlDeferreds = items.map(function(item) {
                    item._childClass = childClass;
                    return $.when(item.createHtml()).then(function(html) {
                        var wrapperTpl = this.__getItemWrapperTemplate(section, item);
                        if (wrapperTpl !== '{item}') {
                            item._hasWrapper = true;
                            return wrapperTpl.render({item: html});
                        }
                        return html;
                    }.bind(this));
                }, this);
                
                $.when.apply($, itemsHtmlDeferreds).done(function() {
                    var elements = $(Array.prototype.join.call(arguments, '').trim());
                    
                    var itemsElements = elements.find('.' + childClass).add(elements.filter('.' + childClass));
                    
                    var wrappedEls = [];
                    itemsElements.each(function(i, el) {
                        items[i]._transformElement($(el));
                    }.bind(this));
                    this._insertItems(section, elements, beforeItem && beforeItem.getElement(), items);
                    items.forEach(function(item, index) {
                        item._setElement(itemsElements.eq(index));
                        item._baseInit();
                        this.__completeAddItem(item);
                    }, this);
                }.bind(this));
            }.bind(this);
            
            //отфильтровываем элементы, разметку, которых не нужно генерировать
            var itemsToInsert = items.filter(function(item) {
                //если элемент уже передан
                if (item.getElement()) {
                    //помечаем его независимым (контейнер не отвечает за его удаление)
                    this.__independentItems[croc.utils.objUniqueId(item)] = true;
                    this.__completeAddItem(item);
                    return false;
                }
                //фаза рендеринга ужа начата
                else if (item.isHtmlGenerated()) {
                    item.once('changeRendered', function() {
                        //помечаем его независимым (контейнер не отвечает за его удаление)
                        this.__independentItems[croc.utils.objUniqueId(item)] = true;
                        this.__completeAddItem(item);
                    }, this);
                    return false;
                }
                return true;
            }, this);
            
            //поэлементная вставка
            if (this.getElement() && itemsToInsert.length) {
                addItemsHtml(itemsToInsert);
            }
            
            return items;
        },
        
        /**
         * Создаёт html-разметку компонента
         * @return {$.Deferred}
         */
        createHtml: function() {
            return croc.ui.Container.superclass.createHtml.call(this, function(widgetHtml) {
                var options = this._options;
                var htmlDeferreds = [];
                var delimiter = '{item}';
                
                var addWrappedCls = '';
                if (this.__wrapSection && widgetHtml) {
                    addWrappedCls = widgetHtml;
                    widgetHtml = '{items:' + this.getDefaultItemsSection() + '}';
                }
                
                var oldItems = options.items;
                options.items = {};
                _.forOwn(oldItems, function(items, section) {
                    options.items[section] = items && items.concat();
                    this.__items[section] = [];
                }, this);
                
                //в опциях может приходить как виджет, так и его описание
                //добавляет разметку виджета в htmlDeferreds, сам виджет в sectionWidgets и возвращает
                //враппер виджета
                var processWidget = function(sectionWidgets, section, item) {
                    if (item instanceof croc.ui.Widget) {
                        item._setParentWidgetAndSection(this, section);
                    }
                    else {
                        item = this.__getItemConf(section, item);
                        var type = croc.ui.WidgetsManager.getInstance().getWidgetType(item.xtype);
                        //noinspection JSValidateTypes
                        item = new type(item);
                    }
                    
                    item._childClass = this.__getChildClass(section, item.getIdentifier());
                    if (section === this.__wrapSection) {
                        item._wrapped = true;
                        item._addClasses = addWrappedCls;
                    }
                    
                    sectionWidgets.push(item);
                    htmlDeferreds.push(item.createHtml());
                    var wrapper = this.__getItemWrapperTemplate(section, item);
                    if (wrapper !== '{item}') {
                        item._hasWrapper = true;
                    }
                    return wrapper;
                }.bind(this);
                
                //ищем в разметке {items:секция:идентификатор}, возвращаем на их место {item}, чтобы потом заменить
                //на реальную разметку виджетов (их deferred складываются в htmlDeferreds
                widgetHtml = widgetHtml.replace(/\{items(?::([^\{}"':]+)?)?(?::([^\{}"':]+))?}/g,
                    function(match, section, identifier) {
                        if (!section) {
                            section = this.getDefaultItemsSection();
                        }
                        var sectionItems = options.items[section];
                        var sectionWidgets = this.__items[section];
                        if (!sectionWidgets) {
                            sectionWidgets = this.__items[section] = [];
                        }
                        
                        var controller = this.__itemsControllers[section];
                        if (controller) {
                            if (controller.isOptimized()) {
                                htmlDeferreds.push(
                                    controller.generateHtml(null, this.__getItemWrapperTemplate.bind(this)));
                                return delimiter;
                            }
                            else {
                                sectionItems = controller.generateWidgets();
                            }
                        }
                        
                        if (!sectionItems) {
                            return '';
                        }
                        
                        //если в шаблоне был указан идентификатор, то берём только соответствующий виджет
                        if (identifier) {
                            var item = this.__getWidgetByIdentifier(sectionItems, identifier, true);
                            if (!item) {
                                throw new Error('Не найден виджет с id ' + identifier);
                            }
                            
                            return processWidget(sectionWidgets, section, item);
                        }
                        
                        //компонуем всю секцию виджетов
                        var result = sectionItems.map(function(item) {
                            return processWidget(sectionWidgets, section, item);
                        }, this).join('');
                        
                        options.items[section] = [];
                        return result;
                        
                    }.bind(this));
                
                return htmlDeferreds.length === 0 ? widgetHtml :
                    //ждём готовности шаблонов для каждого дочернего виджета
                    $.when.apply($, htmlDeferreds).then(function() {
                        var itemsHtml = arguments;
                        var resultHtml = [];
                        
                        //подставляем вместо разделителей шаблоны дочерних виджетов 
                        widgetHtml.split(delimiter).forEach(function(html, index) {
                            resultHtml.push(html);
                            if (itemsHtml[index]) {
                                resultHtml.push(itemsHtml[index]);
                            }
                        });
                        
                        return resultHtml.join('');
                    });
            }.bind(this));
        },
        
        /**
         * Получить все дочерние виджеты в виде хэша
         * @returns {Object.<string, croc.ui.Widget>}
         */
        getAllItems: function() {
            return this.__items || {};
        },
        
        /**
         * Секция дочерних элементов по-умолчанию
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return 'items';
        },
        
        /**
         * Получить дочерний виджет по его идентификатору
         * @param {string} identifier
         * @returns {croc.ui.Widget}
         */
        getItem: function(identifier) {
            return this.__itemsHash[identifier];
        },
        
        /**
         * Возвращает индекс дочернего виджета
         * @param {croc.ui.Widget} widget
         * @returns {*}
         */
        getItemIndex: function(widget) {
            return this.__items[widget.getParentSection()].indexOf(widget);
        },
        
        /**
         * Получить все дочерние виджеты
         * @param {string} [section=null]
         * @returns {Array.<croc.ui.Widget>}
         */
        getItems: function(section) {
            return (this.__items && this.__items[section || this.getDefaultItemsSection()]) || [];
        },
        
        /**
         * Получить элементы дочерних виджетов, как jQuery-коллекцию
         * @param {string} [section=null]
         * @returns {jQuery}
         */
        getItemsElements: function(section) {
            return $(this.getItems(section).map(function(x) { return x.getElement()[0]; }));
        },
        
        /**
         * Уведомить виджет о том, что размеры рамок изменились
         * @param {string} [reason]
         */
        onResize: function(reason) {
            _.forOwn(this.__items, function(items, section) {
                items.forEach(function(item) {
                    if (item.getElement()) {
                        item.onResize('parentResize');
                    }
                });
            });
            
            croc.ui.Container.superclass.onResize.apply(this, arguments);
        },
        
        /**
         * Удалить дочерний виджет
         * @param {croc.ui.Widget|string} item
         * @param {boolean} [removeElement=true]
         */
        removeItem: function(item, removeElement) {
            if (typeof item === 'string') {
                item = this.getItem(item);
            }
            
            croc.utils.arrRemove(this.__items[item.getParentSection()], item);
            
            item.dispose();
            
            var itemId = croc.utils.objUniqueId(item);
            if (this.__independentItems[itemId]) {
                delete this.__independentItems[itemId];
            }
            else if (item.getElement() && (removeElement === undefined || removeElement)) {
                this._removeItemElement(item);
            }
            
            this._onRemoveItem(item);
            
            item._setParentWidgetAndSection(null, null);
            
            this.fireEvent('removeItem', item);
        },
        
        /**
         * Вызывать в onPropertiesInitialized!
         * @param {string|croc.data.IObservableList} [section]
         * @param {croc.data.IObservableList|Object} [model]
         * @param {Object} [options]
         * @returns {croc.ui.ContainerItemsController}
         */
        setItemsController: function(section, model, options) {
            if (!options) {
                options = model;
                model = section;
                section = this.getDefaultItemsSection();
            }
            
            var controller = new croc.ui.ContainerItemsController(_.assign({
                container: this,
                model: model
            }, options));
            
            this.__itemsControllers[section] = controller;
            
            return controller;
        },
        
        /**
         * Применить изменение состояния видимости виджета
         * @param {boolean} value
         * @private
         */
        _applyShown: function(value) {
            croc.ui.Container.superclass._applyShown.apply(this, arguments);
            if (value && this.getElement()) {
                var iterateChildren = function(container) {
                    _.forOwn(container.getAllItems(), function(items) {
                        items.forEach(function(item) {
                            if (item.getElement() && item.hasListeners('appear') && item.getElement().is(':visible')) {
                                item.fireEvent('appear');
                            }
                            if (item instanceof croc.ui.Container) {
                                iterateChildren(item);
                            }
                        });
                    });
                };
                iterateChildren(this);
            }
        },
        
        /**
         * Возвращает конфигурация виджета по его элементу. Конфигурация как минимум должна содержать xtype.
         * @param {string} section
         * @param {jQuery} element
         * @return {object}
         * @protected
         */
        _getConfByElement: function(section, element) {
            return this.__itemsControllers[section] ?
                this.__itemsControllers[section].generateWidgetByElement(element) : {};
        },
        
        /**
         * Шаблон для обрамления дочернего элемента. Должен присутствовать маркер {item}. На обрамляющем элементе
         * должен быть класс js-wrapper.
         * @param {string} section
         * @param {croc.ui.Widget} item дочерний виджет
         * @returns {string}
         * @protected
         */
        _getItemWrapperTemplate: function(section, item) { return '{item}'; },
        
        /**
         * Шаблон для элемента
         * @param {Object} options
         * @return {$.Deferred|string}
         * @protected
         */
        _getTemplate: function(options) {
            return this.__wrapSection ? '{cls}' : croc.ui.Container.superclass._getTemplate.apply(this, arguments);
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            //инициализируем уже сконструированные дочерние виджеты их элементами
            if (this.isHtmlGenerated()) {
                _.forOwn(this.__items, function(widgets) {
                    widgets.forEach(function(item) {
                        item._setElement(this.__itemsElements[croc.utils.objUniqueId(item)]);
                        item._baseInit();
                        this.__completeAddItem(item);
                    }.bind(this));
                }, this);
                
                delete this.__itemsElements;
                
                //если у элемента есть parent id, то запускаем сканирование на дочерние виджеты в разметке
                if (this.getHostId()) {
                    this._rescanItems(true);
                }
            }
            else {
                _.forOwn(this._options.items, function(items, section) {
                    this.__items[section] = [];
                }, this);
                this._rescanItems(true);
            }
            
            _.forOwn(this.__itemsControllers, function(controller) {
                controller.onInitWidget();
            });
        },
        
        /**
         * Вставить дочерние элементы в определённую секцию
         * @param {string} section
         * @param {jQuery} elements
         * @param {jQuery} beforeElement
         * @param {Array.<croc.ui.Widget>} widgets
         * @protected
         */
        _insertItems: function(section, elements, beforeElement, widgets) {
            if (this.__itemsControllers[section]) {
                this.__itemsControllers[section].insertItem(elements, beforeElement);
            }
            else if (beforeElement) {
                beforeElement.before(elements);
            }
            else {
                this.getElement().append(elements);
            }
        },
        
        /**
         * Метод вызывается при добавлении нового дочернего элемента
         * @param {string} section
         * @param {croc.ui.Widget} item
         * @protected
         */
        _onAddItem: function(section, item) {},
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.Container.superclass._onPropertiesInitialized.apply(this, arguments);
            
            var defSection = this.getDefaultItemsSection();
            
            //defaults
            if (options.dItemDefaults) {
                if (!options.hasOwnProperty('itemDefaults')) {
                    options.itemDefaults = _.cloneDeep(options.itemDefaults);
                }
                options.itemDefaults[defSection] = options.itemDefaults[defSection] ?
                    _.assign({}, options.itemDefaults[defSection], options.dItemDefaults) :
                    options.dItemDefaults;
            }
            
            //items
            if (!options.items) {
                options.items = {};
            }
            
            if (Array.isArray(options.items) || options.items instanceof croc.ui.Widget) {
                var items = options.items;
                options.items = {};
                options.items[defSection] = items;
            }
            
            if (!options.items[defSection]) {
                options.items[defSection] = [];
            }
            
            _.forOwn(options.itemDefaults, function(items, section) {
                if (!options.items[section]) {
                    options.items[section] = [];
                }
            }, this);
        },
        
        /**
         * Метод вызывается при удалении дочернего виджета
         * @param {croc.ui.Widget} item
         * @protected
         */
        _onRemoveItem: function(item) {},
        
        /**
         * Удалить дочерний элемент
         * @param {croc.ui.Widget} item
         * @protected
         */
        _removeItemElement: function(item) {
            item.getWrapperElement().remove();
        },
        
        /**
         * Просканировать контейнер на новые дочерние элементы
         * @param {boolean} [getConfFromItems=false] internal!
         * @param {boolean} [autoOnly=false] internal!
         * @protected
         */
        _rescanItems: function(getConfFromItems, autoOnly) {
            var itemsElements = !autoOnly && this._scanForItemsElements(this.getElement(), this._options);
            var hostId = this.getHostId();
            
            //пытаемся автоматически подхватить детей (класс js-{hostId}-child с необязательным атрибутом data-section)
            if ((!itemsElements || this._options.autoScan) && hostId) {
                itemsElements = itemsElements || {};
                this.getElement().find('.js-' + hostId + '-child').each(function(i, el) {
                    el = $(el);
                    var section = el.data('section') || this.getDefaultItemsSection();
                    if (!itemsElements[section]) {
                        itemsElements[section] = el;
                    }
                    else {
                        itemsElements[section] = itemsElements[section].add(el);
                    }
                }.bind(this));
            }
            
            if (itemsElements) {
                _.forOwn(itemsElements, function(elements, section) {
                    var sectionWrapped = this.__wrapSection === section;
                    
                    //если нужно автоматом подхватить детей
                    if (elements === 'auto' && hostId) {
                        var selector = '.js-' + hostId + '-child[data-section=' + section + ']';
                        if (section === this.getDefaultItemsSection()) {
                            selector += ',.js-' + hostId + '-child:not([data-section])';
                        }
                        elements = $(selector);
                    }
                    
                    var resultItems = this.__items[section] || (this.__items[section] = []);
                    var sectionItems = this._options.items[section] || [];
                    var processElement = function(el, i, identifier) {
                        el = $(el);
                        var widget;
                        
                        if (el.hasClass('js-generate')) {
                            widget = croc.ui.Widget.generateWidget(el, this._options.configure);
                            resultItems.push(widget);
                            widget._setParentWidgetAndSection(this, section);
                            this.__completeAddItem(widget);
                            return;
                        }
                        
                        if (!sectionWrapped) {
                            widget = croc.ui.Widget.getByElement(el);
                            if (widget) {
                                if (widget.getParentWidget() !== this) {
                                    resultItems.push(widget);
                                    widget._setParentWidgetAndSection(this, section);
                                    this.__completeAddItem(widget);
                                }
                                return;
                            }
                        }
                        
                        var conf = this._getConfByElement(section, el);
                        if (!(conf instanceof croc.ui.Widget)) {
                            if (identifier) {
                                conf.identifier = identifier.toString();
                            }
                            else if (!sectionWrapped) {
                                identifier = el.data('confIdentifier') || (el.data('conf') && el.data('conf').identifier);
                                
                                if (identifier) {
                                    conf.identifier = identifier.toString();
                                }
                            }
                            
                            // пытаемся взять конфигурацию для виджета из this._options.items, полагаясь либо на положение элемента
                            // в секции либо на совпадение идентификаторов
                            if (getConfFromItems && sectionItems && sectionItems.length) {
                                var gotById = false;
                                if (this.__useChildrenIdentifiers && conf.identifier && sectionItems.length > 1) {
                                    gotById = this.__getWidgetByIdentifier(sectionItems, conf.identifier, true);
                                }
                                
                                if (gotById) {
                                    conf = gotById;
                                }
                                else {
                                    var sectionItem = sectionItems[0];
                                    var sectionItemIdentifier = sectionItem instanceof croc.ui.Widget ?
                                        sectionItem.getIdentifier() : sectionItem.identifier;
                                    if (!sectionItemIdentifier || !identifier || sectionItemIdentifier === identifier) {
                                        conf = sectionItem;
                                        sectionItems.shift();
                                    }
                                }
                            }
                        }
                        
                        var generateEl = el.data('generate');
                        if (conf && conf instanceof croc.ui.Widget) {
                            widget = conf;
                            if (sectionWrapped) {
                                widget._wrapped = true;
                            }
                            if (!generateEl) {
                                widget._setElement(el);
                                widget._setParentWidgetAndSection(this, section);
                                if (!widget.getRendered()) {
                                    widget._baseInit();
                                }
                            }
                        }
                        else {
                            conf = this.__getItemConf(section, conf, el);
                            if (!conf.xtype) {
                                return;
                            }
                            if (generateEl) {
                                delete conf.el;
                            }
                            if (sectionWrapped) {
                                conf._wrapped = true;
                            }
                            var type = croc.ui.WidgetsManager.getInstance().getWidgetType(conf.xtype);
                            widget = new type(conf);
                        }
                        
                        if (widget) {
                            //если нужно сгенерировать новый элемент для виджета
                            if (generateEl) {
                                $.when(widget.createHtml()).done(function(html) {
                                    var newEl = $(html);
                                    el.replaceWith(newEl);
                                    widget._transformElement(newEl);
                                    widget._setElement(newEl);
                                    widget._setParentWidgetAndSection(this, section);
                                    widget._baseInit();
                                    resultItems.push(widget);
                                    this.__completeAddItem(widget);
                                }.bind(this));
                            }
                            else {
                                resultItems.push(widget);
                                this.__completeAddItem(widget);
                            }
                        }
                    }.bind(this);
                    
                    if (elements instanceof jQuery) {
                        elements.each(function(i, el) { processElement(el, i); });
                    }
                    else {
                        var index = 0;
                        _.forOwn(elements, function(el, identifier) {
                            processElement(el, index++, identifier);
                        });
                    }
                }, this);
            }
        },
        
        /**
         * Поиск элементов DOM для всех дочерних элементов
         * @param {jQuery} el
         * @param {Object} options
         * @return {Object.<string, jQuery>}
         * @protected
         */
        _scanForItemsElements: function(el, options) {
            if (this.__wrapSection) {
                var els = {};
                els[this.getDefaultItemsSection()] = el;
                return els;
            }
            else if (Object.keys(this.__itemsControllers).length) {
                var elements = {};
                _.forOwn(this.__itemsControllers, function(controller, section) {
                    elements[section] = controller.isOptimized() ? $() : controller.findItemsElements(el);
                });
                return elements;
            }
            else {
                return null;
            }
        },
        
        /**
         * Изменить элемент ещё не вставленный в DOM корневой элемент
         * @param {jQuery} el
         * @protected
         */
        _transformElement: function(el) {
            croc.ui.Container.superclass._transformElement.apply(this, arguments);
            
            //ищем элементы для уже сконструированных дочерних виджетов
//            var itemsElements = this._scanForItemsElements(el, options);
            
            this.__itemsElements = {};
            _.forOwn(this.__items, function(widgets, section) {
                //дальше мы будем удалять из этого массива виджеты, чтобы дважды не взять один и тот же
                this.__items[section] = widgets.concat();
                
                //ищем элементы для дочерних виджетов
                var elements;
                var childClass = this.__getChildClass(section);
//                //если элементы найдены через метод _scanForItemsElements
//                if (itemsElements && itemsElements[section]) {
//                    elements = itemsElements[section];
//                }
//                //ищем элементы по уникальному классу для дочерних виджетов, либо определяем, что элемент дочернего
//                //виджета идентичен элементу контейнера
//                else {
                elements = this.__wrapSection !== section ? el.find('[class*=' + childClass + ']') :
                    section === this.getDefaultItemsSection() ? el : $();
//                }
                
                var elementIndex = 0;
                var initElement = function(i, el) {
                    el = $(el);
                    var widget = /** @type {croc.ui.Widget} */(widgets[elementIndex++]);
                    
                    var concreteChildClassMatch = el[0].className.match(new RegExp(childClass + '([^ ]*)'));
                    var concreteChildClass = concreteChildClassMatch && concreteChildClassMatch[0];
                    var identifier = concreteChildClassMatch && concreteChildClassMatch[1];
                    if (this.__useChildrenIdentifiers && identifier) {
                        var gotById = this.__getWidgetByIdentifier(widgets, identifier, true);
                        if (gotById) {
                            widget = gotById;
                            --elementIndex;
                        }
                    }
                    
                    widget._transformElement(el);
                    this.__itemsElements[croc.utils.objUniqueId(widget)] = el;
                    
                    if (this.__wrapSection === section && concreteChildClass) {
                        el.removeClass(concreteChildClass);
                    }
                }.bind(this);
                
                if (elements instanceof jQuery) {
                    elements.each(initElement);
                }
                //при сканировании элементов указаны конкретные identifiers {identifier: jQuery}
                else {
                    var index = 0;
                    _.forOwn(elements, function(el) {
                        initElement(index++, el);
                    });
                }
            }, this);
        },
        
        /**
         * @param {croc.ui.Widget} item
         * @private
         */
        __completeAddItem: function(item) {
            if (item.getIdentifier()) {
                this.__itemsHash[item.getIdentifier()] = item;
            }
            this.fireEvent('beforeAddItem', item, item.getMeta());
            this._onAddItem(item.getParentSection(), item);
            this.fireEvent('itemAdded', item);
        },
        
        /**
         * @param {string} section
         * @param {string} [identifier]
         * @private
         */
        __getChildClass: function(section, identifier) {
            return this.__wrapSection ? this._childClass :
            'stm-child-' + croc.utils.objUniqueId(this) + '-' + section + '-' + (identifier || '');
        },
        
        /**
         * @param {string} section
         * @param {object} item
         * @param {jQuery} [el=undefined]
         * @private
         */
        __getItemConf: function(section, item, el) {
            var conf = {_parentWidget: this, _parentSection: section};
            if (el) {
                conf.el = el;
            }
            if (this.$$compatibilityMode && this.constructor.prototype.itemDefaults &&
                this.constructor.prototype.itemDefaults[section]) {
                _.assign(conf, this.constructor.prototype.itemDefaults[section]);
            }
            if (this._options.itemDefaults[section]) {
                _.assign(conf, this._options.itemDefaults[section]);
            }
            if (item) {
                _.assign(conf, item);
            }
            
            if (this.__wrapSection !== section && el && el.data('xtype')) {
                conf.xtype = el.data('xtype');
            }
            
            if (this._options.configure) {
                conf.configure = _.clone(this._options.configure);
            }
            
            return conf;
        },
        
        /**
         * @param section
         * @param item
         * @private
         */
        __getItemWrapperTemplate: function(section, item) {
            return item.getMeta && item.getMeta().noWrap ? '{item}' : this._getItemWrapperTemplate(section, item);
        },
        
        /**
         * @param array
         * @param identifier
         * @param remove
         * @private
         */
        __getWidgetByIdentifier: function(array, identifier, remove) {
            var widget;
            array.some(function(item, i) {
                if ((item instanceof croc.ui.Widget ? item.getIdentifier() : item.identifier) === identifier) {
                    widget = item;
                    if (remove) {
                        array.splice(i, 1);
                    }
                    return true;
                }
            });
            
            return widget;
        }
    }
});
