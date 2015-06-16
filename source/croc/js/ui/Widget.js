//+require croc.ui.WidgetsManager

/**
 * Базовый класс для всех виджетов, которые имеют привязку к одному единственному элементу
 */
croc.Class.define('croc.ui.Widget', {
    extend: croc.Object,
    implement: croc.ui.IWidget,
    
    statics: {
        /**
         * @type {jQuery}
         * @static
         */
        FICTIVE: croc.isClient && $(),
        
        /**
         * @private
         * @static
         */
        __NONUNIT_CSS_PROPERTIES: {
            'z-index': true,
            'opacity': true
        },
        
        /**
         * Генерирует виджет на основе тега с классом js-generate
         * @param {jQuery} el
         * @param {Object} [configure]
         * @returns {croc.ui.Widget}
         */
        generateWidget: function(el, configure) {
            var type = croc.ui.WidgetsManager.getInstance().getWidgetType(el.data('xtype'));
            var conf = croc.ui.Widget.getConfFromElement(el);
            conf.replaceEl = el;
            
            if (type.config && type.config.options) {
                var options = type.config.options;
                _.forOwn(conf, function(value, name) {
                    if (options[name]) {
                        conf[name] = croc.ui.Widget.__castOption(options[name], value);
                    }
                });
            }
            
            if (configure) {
                conf.configure = configure;
            }
            
            return new type(conf);
        },
        
        /**
         * Возвращает виджет по его DOM-элементу
         * @param {jQuery|Element|string} el
         * @param {boolean} [tryToConstruct=false]
         * @param {boolean} [construct=false]
         * @returns {croc.ui.Widget}
         * @static
         */
        getByElement: function(el, tryToConstruct, construct) {
            el = $(el);
            var widget = el.data('$$stmWidget') || null;
            if (widget) {
                return widget;
            }
            
            if (construct || (tryToConstruct && el.hasClass('js-construct'))) {
                var type = croc.ui.WidgetsManager.getInstance().getWidgetType(el.data('xtype') || 'croc.ui.Widget');
                widget = new type({el: el});
            }
            return widget;
        },
        
        /**
         * Возвращает ближайший родительский виджет для переданного элемента
         * @param {jQuery} el
         * @returns {croc.ui.Widget}
         */
        getClosestWidget: function(el) {
            var closest = el.closest('.js-widget');
            return closest.length ? this.getByElement(closest) : croc.ui.WidgetsManager.getPageWidget();
        },
        
        /**
         * Получить конфигурацию виджета на основе его DOM-элемента
         * @param {jQuery} el
         * @returns {Object}
         * @static
         */
        getConfFromElement: function(el) {
            var conf = el.data('widgetConf');
            if (conf) {
                return conf;
            }
            
            conf = {};
            
            if (el.data('conf')) {
                _.assign(conf, el.data('conf'));
            }
            
            if (el[0] && el[0].attributes) {
                Array.prototype.forEach.call(el[0].attributes, function(attr) {
                    if (attr.name.indexOf('data-conf-') === 0) {
                        var key = attr.name.substr('data-conf-'.length)
                            .replace(/-(\w)/g, function($0, $1) {return $1.toUpperCase();});
                        
                        conf[key] = el.data(attr.name.substr('data-'.length));
                    }
                });
            }
            
            el.data('widgetConf', conf);
            
            return conf;
        },
        
        /**
         * Возвращает html для переданного класса виджета
         * @param {Function} widgetCls
         * @param {Object} [conf]
         */
        render: function(widgetCls, conf) {
            return croc.utils.defSync(new widgetCls(conf).createHtml());
        },
        
        /**
         * Если передан виджет, то возрвщает его элемент, иначе возвращает параметр
         * @param {jQuery|croc.ui.Widget} from
         */
        resolveElement: function(from) {
            return from instanceof croc.ui.Widget ? from.getElement() : from;
        },
        
        /**
         * @param {Object} option
         * @param value
         * @returns {*}
         * @private
         * @static
         */
        __castOption: function(option, value) {
            if (value === null) {
                return value;
            }
            
            switch (option.type) {
                case 'string':
                    return value.toString();
                
                case 'boolean':
                    return value === 'false' ? false : !!value;
                
                case 'number':
                case 'integer':
                    return parseFloat(value);
                
                default:
                    return value;
            }
        }
    },
    
    events: {
        /**
         * Виджет стал видимым (у одного из родителей был вызван setShown(true))
         */
        appear: null,
        
        /**
         * @deprecated
         */
        render: null,
        
        /**
         * Попытка отрисовки виджета провалилась
         */
        renderFailed: null,
        
        /**
         * размеры виджета изменились
         * @param {string} reason
         */
        resize: null
    },
    
    properties: {
        /**
         * Автоматически вызывать метод onResize при изменении размеров окна
         * @type {boolean}
         */
        autoResize: {
            type: 'boolean',
            value: false,
            option: true,
            apply: '__applyAutoResize'
        },
        
        /**
         * @type {string}
         */
        mod: {
            type: 'string',
            cssClass: true
        },
        
        /**
         * @type {boolean}
         */
        rendered: {
            getter: null,
            __setter: null,
            event: true
        },
        
        /**
         * @type {boolean}
         */
        shown: {
            type: 'boolean',
            field: '__shown',
            apply: '_applyShown',
            value: true,
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * Объект {ключ=>функция}. Дочерние виджеты наследуют все функции из этого объекта. При совпадении атрибута
         * data-configure с одним из ключей в этом объекте вызвается соответствующая функция для конфигурации
         * виджета. Используется в случае если иерархия виджетов инициализируется из разметки и какие-либо из
         * их опций невозможно передать через data-атрибуты (например, функции).
         * @type {Object.<string, function(croc.ui.Widget)>}
         */
        configure: {
            type: 'object',
            value: {}
        },
        
        /**
         * DOM-элемент виджета. Указывается, если виджет инициализируется из разметки.
         * @type {string|Element|jQuery}
         */
        el: {
            //type: ['string', Element, jQuery]
        },
        
        /**
         * Дополнительные классы для блока через пробел
         * @type {string}
         * todo заменить на array
         */
        extraCls: {
            type: 'string'
        },
        
        /**
         * Метод сокрытия виджета при изменении свойства {@link #shown}.
         * @type {string}
         */
        hideMethod: {
            check: ['hide', 'detach'],
            value: 'hide'
        },
        
        /**
         * Идентификатор виджета, по которому будет осуществляться поиск дочерних элементов и субэлементов
         * @type {string}
         */
        hostId: {
            type: 'string'
        },
        
        /**
         * Шаблон по-умолчанию
         * @type {string|$.Deferred}
         */
        htmlTemplate: {},
        
        /**
         * Идентификатор виджета, по которому его можно получить из родительского
         * @type {string}
         */
        identifier: {
            type: 'string'
        },
        
        /**
         * Шаблон включает в себя дочерние шаблоны обёрнутые в тег <script>
         * @type {boolean}
         */
        includesSubTemplates: false,
        
        /**
         * мета-данные для добавления дочернего виджета
         * @type {object}
         */
        meta: {
            type: 'object',
            value: {},
            deepExtend: true
        },
        
        /**
         * Модификатор блока (css класс mod_...)
         * @type {string}
         */
        mod: {
            type: 'string',
            property: 'mod'
        },
        
        /**
         * Элемент-контейнер виджета. Передаётся если разметка виджета должна быть создана динамически.
         * @type {string|Element|jQuery}
         */
        renderTo: {
            //type: ['string', Element, jQuery]
        },
        
        /**
         * Указывается вместо renderTo, показывает, что новым элементом нужно заменить переданный
         * @type {string|Element|jQuery}
         */
        replaceEl: {
            //type: ['string', Element, jQuery]
        },
        
        /**
         * Css-стили корневого элемента виджета
         * @type {Object}
         */
        style: {
            type: 'object',
            extend: true
        },
        
        xtype: {},
        
        /**
         * Ширина виджета
         * @type {number|string}
         */
        width: {
            type: ['number', 'string']
        },
        
        /**
         * Враппер виджета
         * @type {jQuery}
         */
        wrapperEl: {
            //type: jQuery
        },
        
        /**
         * html, в который следует обернуть виджет (должен присутствовать маркер {item})
         * @type {string}
         */
        wrapperTemplate: {},
        
        /**
         * Дополнительные классы для корневого элемента
         * @type {Array.<string>}
         */
        _addClasses: {
            type: 'array',
            concat: true
        },
        
        /**
         * @type {string}
         * @protected
         * @internal
         */
        _childClass: {},
        
        _parentWidget: {},
        
        _parentSection: {},
        
        /**
         * Виджет обёрнут родительским контейнером {@see croc.ui.Container.options._wrapSection}
         * @type {boolean}
         */
        _wrapped: {}
    },
    
    construct: function(options) {
        croc.ui.Widget.superclass.construct.apply(this, arguments);
        
        if (this.getAutoResize()) {
            this.__applyAutoResize(this.getAutoResize());
        }
        
        this.__parentSection = options._parentSection;
        this.__parentWidget = options._parentWidget;
        this.__subElements = {};
        this._childClass = options._childClass;
        this._wrapped = options._wrapped;
        this._addClasses = '';
        
        //если передан элемент или место вставки производим инициализацию виджета
        if (options.el || options.renderTo || options.replaceEl) {
            this._baseInit();
        }
    },
    
    destruct: function() {
        croc.ui.WidgetsManager.getInstance().unregisterWidget(this);
    },
    
    members: {
        $$checkRequiredOptions: false,
        
        /**
         * Всплывающий ресайз компонента
         */
        bubbleResize: function() {
            var widget = this;
            var parent;
            var pageWidget = croc.ui.WidgetsManager.getPageWidget();
            while ((parent = widget.getParentWidget())) {
                if (parent === pageWidget) {
                    break;
                }
                widget = parent;
            }
            
            widget.onResize('bubbleResize');
        },
        
        /**
         * Создаёт html-разметку компонента
         * @param [transformHtml] internal
         * @return {$.Deferred}
         */
        createHtml: function(transformHtml) {
            var options = this._options;
            this._onPropertiesInitialized(options);
            this.__htmlGenerated = true;
            
            var scripts = [];
            var deferred = $.when(this._getTemplate(options))
                .then(function(tpl) {
                    if (options.includesSubTemplates) {
                        tpl = tpl.toString().replace(/<script type="text\/x-jquery-tmpl"[\s\S]*?<\/script>/g,
                            function(match) {
                                scripts.push(match);
                                return '__script_template__';
                            });
                    }
                    
                    //todo убрать compatibility mode
                    var html = tpl.render(_.assign({
                        cls: this.__getCssClassPropsString() +
                        (options._addClasses ? ' ' + options._addClasses.join(' ') : '') +
                        this._addClasses +
                        (options.extraCls ? ' ' + options.extraCls : '') +
                        (this._childClass ? ' ' + this._childClass : '') +
                        (!this._wrapped ? ' js-widget' : '')
                    }, this._getAddRenderData(options)));
                    
                    //style
                    if (options.style) {
                        var nonunit = croc.ui.Widget.__NONUNIT_CSS_PROPERTIES;
                        var styles = _.map(options.style, function(value, key) {
                            key = croc.utils.strDasherize(key);
                            if (!nonunit[key] && typeof value === 'number' && value !== 0) {
                                value = value + 'px';
                            }
                            return key + ': ' + value + ';';
                        }).join(' ');
                        html = html.replace(/(<[^ ]+ )/, '$1style="' + styles + '" ');
                    }
                    
                    if (transformHtml) {
                        html = transformHtml(html);
                    }
                    
                    if (!options.wrapperTemplate) {
                        return html;
                    }
                    else if (typeof html === 'string') {
                        return options.wrapperTemplate.render({item: html});
                    }
                    else {
                        return $.when(html).then(function(html) {
                            return options.wrapperTemplate.render({item: html});
                        });
                    }
                }.bind(this));
            
            return options.includesSubTemplates ? deferred.then(function(html) {
                return html.replace(/__script_template__/g, function() {
                    return scripts.shift();
                });
            }) : deferred;
        },
        
        /**
         * Полное разрушение виджета
         */
        destroy: function() {
            if (this.__parentWidget) {
                this.__parentWidget.removeItem(this);
            }
            else {
                this.dispose();
                this.__wrapperEl.remove();
            }
        },
        
        /**
         * Получить DOM-элемент виджета
         * @returns {jQuery}
         */
        getElement: function() {
            return this.__el;
        },
        
        /**
         * Идентификатор виджета, по которому будет осуществляться поиск дочерних элементов и субэлементов
         */
        getHostId: function() {
            return this._options.hostId;
        },
        
        /**
         * Получить/сгенерировать dom id элемента
         * @return {string}
         */
        getId: function() {
            if (this.__id) {
                return this.__id;
            }
            
            if (this.__el) {
                this.__id = this.__el.attr('id');
            }
            if (!this.__id) {
                this.__id = croc.utils.getStmId();
                if (this.__el) {
                    this.__el.attr('id', this.__id);
                }
            }
            
            return this.__id;
        },
        
        /**
         * Идентификатор виджета
         * @returns {string}
         */
        getIdentifier: function() {
            return this._options.identifier;
        },
        
        /**
         * Мета-данные виджета
         * @returns {Object}
         */
        getMeta: function() {
            return this._options.meta;
        },
        
        /**
         * Возвращает индекс виджета у родителя
         * @returns {number}
         */
        getParentIndex: function() {
            return this.__parentWidget.getItems(this.__parentSection).indexOf(this);
        },
        
        /**
         * Родительская секция
         * @return {string}
         */
        getParentSection: function() {
            return this.__parentSection;
        },
        
        /**
         * Родительский виджет
         * @return {croc.ui.Container}
         */
        getParentWidget: function() {
            return this.__parentWidget;
        },
        
        /**
         * Получить элемент внутри элемента виджета, класс которого равень js-[dataId]-[id],
         * где [dataId] - это значение атрибута data-conf-host-id элемента виджета.
         * @param {jQuery|string} [el]
         * @param {string|boolean} [id]
         * @param {boolean} [ignoreCache=false]
         * @returns {jQuery}
         */
        getSubElement: function(el, id, ignoreCache) {
            if (typeof el === 'string') {
                ignoreCache = id;
                id = el;
                el = this.getElement();
            }
            
            var subElement = !ignoreCache && this.__subElements[id];
            if (!subElement) {
                subElement = this.__subElements[id] = el.find(this.getSubElementSelector(id));
            }
            
            return subElement;
        },
        
        /**
         * Селектор для субэлемента
         * @param {string} id
         * @returns {string}
         */
        getSubElementSelector: function(id) {
            if (!this.getHostId()) {
                throw new Error('Отсутствует hostId');
            }
            if (id === 'child') {
                throw new Error('id === "child" запрещён!');
            }
            return '.js-' + this.getHostId() + '-' + id;
        },
        
        /**
         * Вернуть шаблон из дочернего элемента в виде строки
         * @param {string} id
         * @return {string}
         */
        getSubTemplate: function(id) {
            return this.getSubElement(id).html().trim();
        },
        
        /**
         * @type {string}
         */
        getWidth: function() {
            return this._options.width;
        },
        
        /**
         * Враппер виджета. Если нет то возвращает корневой элемент виджета.
         * @returns {jQuery}
         */
        getWrapperElement: function() {
            return this.__wrapperEl;
        },
        
        /**
         * Есть ли у виджета врапер
         * @return {boolean}
         */
        hasWrapper: function() {
            return this._hasWrapper;
        },
        
        /**
         * Инициализировать виджет элементом (используется после создания разметки через createHtml)
         * @param {jQuery} el
         * @param {croc.ui.Container} [parent]
         */
        initWith: function(el, parent) {
            this._transformElement(el);
            this._setElement(el);
            this._baseInit();
            if (parent) {
                parent.add(this.getMeta().section || parent.getDefaultItemsSection(), this);
            }
        },
        
        /**
         * Виден ли в данный момент виджет
         * @returns {boolean}
         */
        isVisible: function() {
            return !!this.getElement() && this.getElement().is(':visible');
        },
        
        /**
         * Была ли разметка виджета сгенерирована
         * @returns {boolean}
         */
        isHtmlGenerated: function() {
            return !!this.__htmlGenerated;
        },
        
        /**
         * Была ли отрисовка виджета неудачной
         * @returns {boolean}
         */
        isRenderFailed: function() {
            return this.__isRenderFailed || false;
        },
        
        /**
         * Если элемент виден, то callback вызывается сразу иначе на событие appear
         * @param {function} callback
         * @param {Object} [context]
         * @returns {Function}
         */
        onAppear: function(callback, context) {
            if (this.isVisible()) {
                callback.call(context || window);
                return _.noop;
            }
            else {
                return this.once('appear', function() {
                    callback.call(context || window);
                });
            }
        },
        
        /**
         * Уведомить виджет о том, что размеры рамок изменились
         * Причины вызова метода: reposition, modelChange, show, parentResize, bubbleResize
         * @param {string} [reason]
         */
        onResize: function(reason) {
            this._onResize(reason);
            this.fireEvent('resize', reason);
        },
        
        /**
         * Если элемент отрисован, то callback вызывается сразу иначе на событие changeRendered
         * @param {function} callback
         * @param {Object} [context]
         * @returns {Function}
         */
        onRender: function(callback, context) {
            if (this.getRendered()) {
                callback.call(context || window);
                return _.noop;
            }
            else {
                return this.once('changeRendered', function() {
                    callback.call(context || window);
                });
            }
        },
        
        /**
         * Изменить ширину виджета
         * @type {number|string}
         */
        setWidth: function(width) {
            if (typeof width === 'number') {
                width = width + 'px';
            }
            this._options.width = width;
            if (this.__el) {
                this.__el.css('width', width);
            }
        },
        
        /**
         * Применить изменение состояния видимости виджета
         * @param {boolean} value
         * @protected
         */
        _applyShown: function(value) {
            if (this.__wrapperEl) {
                if (this._options.hideMethod === 'detach') {
                    if (value) {
                        if (!this.__wrapperEl.closest('body').length) {
                            this.__detachParent.append(this.__wrapperEl);
                        }
                        if (!this.__wrapperEl.is(':visible')) {
                            croc.utils.domShow(this.__wrapperEl);
                        }
                    }
                    else {
                        this.__detachParent = this.__wrapperEl.parent();
                        this.__wrapperEl.detach();
                    }
                }
                else {
                    if (!value) {
                        croc.utils.domHide(this.__wrapperEl);
                    }
                    else {
                        if (this.__wrapperEl.hasClass('g-hidden')) {
                            croc.utils.domShow(this.__wrapperEl);
                        }
                        else {
                            this.__wrapperEl.toggle(value);
                        }
                    }
                }
                
                if (value && this.hasListeners('appear') && this.__el.is(':visible')) {
                    this.fireEvent('appear');
                }
            }
        },
        
        /**
         * Базовая инициализация (после привязки виджета к общему дереву виджетов)
         * @protected
         */
        _baseInit: function() {
            croc.ui.WidgetsManager.getInstance().registerWidget(this);
            
            var options = this._options;
            
            if (options.el) {
                this._setElement(options.el instanceof jQuery ? options.el : $(options.el), options.wrapperEl);
            }
            
            if (options.renderTo && !(options.renderTo instanceof jQuery)) {
                options.renderTo = $(options.renderTo);
            }
            
            if (options.replaceEl && !(options.replaceEl instanceof jQuery)) {
                options.replaceEl = $(options.replaceEl);
            }
            
            if ((!this.__el || !this.__el.length) && this.__el !== croc.ui.Widget.FICTIVE &&
                (!options.renderTo || !options.renderTo.length) &&
                (!options.replaceEl || !options.replaceEl.length)) {
                throw new Error('Не передан ни элемент ни его родитель!');
            }
            
            if (options.el && (options.renderTo || options.replaceEl)) {
                throw new Error('Передан и элемент и его родитель!');
            }
            
            var initWidget = function() {
                //noinspection JSHint
                if (options.width && !this.__widthGotFromEl && options.width != this.__el.css('width')) {
                    this.__el.css('width', options.width);
                }
                this.__initStyles(this.__el);
                
                $.when(this._initWidget())
                    .done(function() {
                        this.__setRendered(true);
                        //todo deprecated
                        this.fireEvent('render', this, this.__el);
                        
                        if (this.__shown && this.hasListeners('appear') && this.__el.is(':visible')) {
                            this.fireEvent('appear');
                        }
                    }.bind(this))
                    .fail(function() {
                        this.__isRenderFailed = true;
                        this.fireEvent('renderFailed');
                    }.bind(this));
            }.bind(this);
            
            //разметка виджета уже создана родителем
            if (this.isHtmlGenerated()) {
                this.__initializeOptions();
                this._checkMissedOptions(options);
                initWidget();
            }
            //виджет инициализируется из разметки
            else if (this.__el) {
                this.__initializeProperties();
                this._checkMissedOptions(options);
                this._onPropertiesInitialized(options);
                initWidget();
            }
            //разметка виджета создаётся динамически
            else if (options.renderTo || options.replaceEl) {
                this._checkMissedOptions(options);
                this.createHtml().done(function(html) {
                    var wrapperEl = $(html);
                    var el = this._hasWrapper ? wrapperEl.find('.js-widget:eq(0)') : wrapperEl;
                    
                    this._transformElement(el);
                    
                    if (options.renderTo) {
                        options.renderTo.append(wrapperEl);
                    }
                    else {
                        options.replaceEl.replaceWith(wrapperEl);
                    }
                    
                    this._setElement(el, wrapperEl);
                    this.__initializeOptions();
                    
                    initWidget();
                }.bind(this));
            }
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return {};
        },
        
        /**
         * Шаблон для элемента
         * @param {Object} options
         * @return {$.Deferred|string}
         * @protected
         */
        _getTemplate: function(options) {
            if (options.htmlTemplate) {
                return options.htmlTemplate;
            }
            throw new Error('Отсутствует шаблон!');
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
        },
        
        /**
         * Внутренняя реализация onResize
         * @param {string} [reason]
         * @protected
         */
        _onResize: function(reason) {},
        
        /**
         * Запросить шаблон по его имени
         * @param {string} name
         * @param {function(string):string} [transform=null]
         * @returns {$.Deferred}
         * @protected
         */
        _requestTemplate: function(name, transform) {
            var def = croc.getService(croc.services.Resources).loadTemplate(name);
            if (transform) {
                def = def.then(function(tpl) {
                    return transform(tpl);
                });
            }
            return def;
        },
        
        /**
         * Назначить элемент виджету
         * @param {jQuery} el
         * @param {jQuery} [wrapperEl]
         * @protected
         */
        _setElement: function(el, wrapperEl) {
            if (this.__elementSet) {
                return;
            }
            
            if (this._hasWrapper && !wrapperEl) {
                wrapperEl = el.closest('.js-wrapper');
            }
            
            this.__shownSet = false;
            if (!this.__htmlGenerated && el.hasClass('g-hidden')) {
                this.setShown(false);
                this.__shownSet = true;
            }
            
            this.__el = el;
            this.__wrapperEl = wrapperEl || el;
            
            if (!el.data('$$stmWidget')) {
                el.data('$$stmWidget', this);
            }
            if (wrapperEl && !wrapperEl.data('$$stmWidget')) {
                wrapperEl.data('$$stmWidget', this);
            }
            
            if (this.__id && !el.attr('id')) {
                el.attr('id', this.__id);
            }
            
            this.__elementSet = true;
        },
        
        /**
         * Назначить родительский виджет и секцию
         * @param {croc.ui.Container} widget
         * @param {string} section
         * @protected
         */
        _setParentWidgetAndSection: function(widget, section) {
            if (this.__parentWidget && this.__parentWidget.configure) {
                this._options.configure =
                    _.assign({}, this.__parentWidget._options.configure, this._options.configure || {});
            }
            this.__parentWidget = widget;
            this.__parentSection = section;
        },
        
        /**
         * Изменить элемент ещё не вставленный в DOM корневой элемент
         * @param {jQuery} el
         * @protected
         */
        _transformElement: function(el) {},
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this._hasWrapper = !!options.wrapperTemplate;
        },
        
        /**
         * @param {boolean} value
         * @private
         */
        __applyAutoResize: function(value) {
            if (this.__autoResizeListener) {
                this._getDisposer().disposeItem(this.__autoResizeListener);
                this.__autoResizeListener = null;
            }
            
            if (value) {
                this.__autoResizeListener = this._getDisposer().addListener($(window), 'resize',
                    _.throttle(this.disposableFunc(this.onResize, this), 50));
                if (this.getRendered()) {
                    this.onResize('changeSize');
                }
                else {
                    this.once('changeRendered', this.onResize.bind(this, 'show'));
                }
            }
        },
        
        /**
         * @returns {string}
         * @private
         */
        __getCssClassPropsString: function() {
            var props = [];
            if (this.$$propertiesToClass) {
                _.forOwn(this.$$propertiesToClass, function(prop) {
                    var value = this[prop.getterName]();
                    if (value !== undefined && value !== null) {
                        props.push(this.__getPropCssClassValue(value, prop));
                    }
                }, this);
            }
            
            return props.length ? ' ' + props.join(' ') : '';
        },
        
        /**
         * @param {string} value
         * @param {Object} [prop]
         * @returns {string}
         * @private
         */
        __getPropCssClassValue: function(value, prop) {
            return croc.utils.domGetCssModifier(value,
                prop && (typeof prop.cssClass === 'string' ? prop.cssClass : prop.name));
        },
        
        /**
         * @private
         */
        __initializeOptions: function() {
            var options = this._options;
            if (this._wrapped) {
                return;
            }
            
            //берём опции из разметки элемента, делаем приведение и проверку типов
            var confFromElement = croc.ui.Widget.getConfFromElement(this.__el);
            var optionsDesc = this.constructor.config.options;
            
            _.forOwn(confFromElement, function(value, optionName) {
                var option = optionsDesc[optionName];
                if (!option) {
                    if (!this.$$compatibilityMode) {
                        throw new Error('Из разметки была передана неверная опция: ' +
                        this.constructor.classname + '#' + optionName);
                    }
                }
                else if (option.type || option.check) {
                    value = croc.ui.Widget.__castOption(option, value);
                    croc.Class.checkType(option, value, true, this.constructor.classname, option.name);
                }
                
                options[optionName] = value;
                
                if (this.$$optionsToProperty && this.$$optionsToProperty[optionName]) {
                    this.setProperty(typeof option.property === 'string' ? option.property : option.name, value);
                }
                
                delete this.$$missedRequiredOptions[optionName];
            }, this);
        },
        
        /**
         * @private
         */
        __initializeProperties: function() {
            var options = this._options;
            
            //назначаем класс js-widget
            this.__el.addClass('js-widget');
            if (this.__wrapperEl !== this.__el) {
                this.__wrapperEl.addClass('js-wrapper');
            }
            
            this.__initializeOptions();
            
            //назначаем свойства и опции из css-классов
            if (this.$$propertiesToClass) {
                _.forOwn(this.$$propertiesToClass, function(prop, propName) {
                    var value = croc.utils.domGetModifier(this.__el,
                        typeof prop.cssClass === 'string' ? prop.cssClass : propName);
                    if (value) {
                        this[prop.setterName](value);
                        if (this.$$propertiesToOptions && this.$$propertiesToOptions[propName]) {
                            options[this.$$propertiesToOptions[propName].name] = value;
                        }
                    }
                }, this);
            }
            
            if (!this._wrapped) {
                if (!options.width) {
                    options.width = this.__el.width();
                    this.__widthGotFromEl = true;
                }
                
                if (this.__el.data('configure')) {
                    options.configure[this.__el.data('configure')](this, options);
                }
            }
        },
        
        /**
         * todo перенести сюда width
         * @param {jQuery} el
         * @private
         */
        __initStyles: function(el) {
            if (this.__widgetStylesInited) {
                return;
            }
            
            if (!this.__shown && (!this.__shownSet || this._options.hideMethod === 'detach')) {
                this._applyShown(false);
            }

            if (!this.__htmlGenerated) {
                if (this._options.style) {
                    el.css(this._options.style);
                }
                
                if (this.$$propertiesToClass) {
                    _.forOwn(this.$$propertiesToClass, function(prop) {
                        var value;
                        if (prop.forceCssClass && (value = this[prop.getterName]())) {
                            el.addClass(this.__getPropCssClassValue(value, prop));
                        }
                    }, this);
                }
            }
            
            this.__widgetStylesInited = true;
        }
    },
    
    onClassCreate: function(Cls) {
        var config = Cls.config;
        var baseCls = Cls.baseclass;
        if (config.properties) {
            var propertiesToClass = {};
            _.forOwn(config.properties, function(prop, propName) {
                if (prop.cssClass) {
                    var oldApply = (prop.apply && prop.apply.$$source) || prop.apply;
                    prop.apply = function(value, oldValue) {
                        if (oldApply) {
                            (typeof oldApply === 'string' ? this[oldApply] : oldApply).apply(this, arguments);
                        }
                        if (this.__el) {
                            var oldCls = this.__getPropCssClassValue(oldValue, prop);
                            if (oldCls) {
                                this.__el.removeClass(oldCls);
                            }
                            var newCls = this.__getPropCssClassValue(value, prop);
                            if (newCls) {
                                this.__el.addClass(newCls);
                            }
                        }
                    };
                    prop.apply.$$source = oldApply;
                    propertiesToClass[propName] = prop;
                }
            });
            
            if (Object.keys(propertiesToClass).length) {
                Cls.prototype.$$propertiesToClass = baseCls && baseCls.prototype.$$propertiesToClass ?
                    _.assign({}, baseCls.prototype.$$propertiesToClass, propertiesToClass) : propertiesToClass;
            }
        }
        
        //todo убрать (compatibility mode)
        if (Cls.classname && Cls.config.type !== 'abstract') {
            croc.ui.WidgetsManager.getInstance().registerAlias(Cls, Cls.classname);
        }
    }
});