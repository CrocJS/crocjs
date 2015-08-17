var Component = require('derby/lib/components').Component;

var oldComponentPrototype = Component.prototype;
Component.prototype = Object.create(croc.Object.prototype);
Component.prototype.constructor = Component;
Component.superclass = croc.Object.prototype;
_.defaults(Component.prototype, oldComponentPrototype);
Component.config = croc.Object.config;

/**
 * api-ru Базовый класс для всех виджетов, которые имеют привязку к одному единственному элементу
 * api-en Base class for all widgets that associated with one single element.
 */
croc.Class.define('croc.cmp.Widget', {
    extend: Component,
    implement: croc.cmp.IWidget,
    
    statics: {
        CLASSES: [],
        
        /**
         * @private
         * @static
         */
        __NONUNIT_CSS_PROPERTIES: {
            'z-index': true,
            'opacity': true
        },
        
        /**
         * @param {Function} widgetCls
         */
        getView: function(widgetCls) {
            return widgetCls.View || (widgetCls.View = this.getView(widgetCls.baseclass));
        },
        
        /**
         * api-ru Возвращает виджет по его DOM-элементу
         * api-en Returns widget by it DOM-element.
         * @param {jQuery|Element|string} el
         * @returns {croc.ui.Widget}
         * @static
         */
        getByElement: function(el) {
            el = $(el);
            var cmps = croc.app.model.data.$components;
            var cmp = cmps && cmps[el.data('cmpid')];
            return cmp && cmp.$controller;
        },
        
        /**
         * api-ru Возвращает ближайший родительский виджет для переданного элемента
         * api-en Returns closest parent widget for sent element.
         * @param {jQuery} el
         * @returns {croc.ui.Widget}
         */
        getClosestWidget: function(el) {
            var closest = el.closest('.js-widget');
            return closest.length ? this.getByElement(closest) : null;//croc.ui.WidgetsManager.getPageWidget();
        },
        
        /**
         * api-ru Если передан виджет, то возрвщает его элемент, иначе возвращает параметр
         * api-en If widget is sent, then it returns his element, otherwise returns his parameter.
         * @param {jQuery|croc.cmp.Widget} from
         */
        resolveElement: function(from) {
            return from && from instanceof croc.cmp.Widget ? from.getElement() : from;
        }
    },
    
    events: {
        /**
         * A child widget was added
         * @param {croc.cmp.Widget} widget
         */
        addChild: null,
        
        appear: null,
        
        /**
         * @param model
         */
        beforeInitModel: null,
        
        beforeInitWidget: null,
        
        create: null,
        destroy: null,
        init: null,
        
        /**
         * @param {croc.cmp.Widget} widget
         */
        initChild: null,
        
        /**
         * A child widget was removed
         * @param {croc.cmp.Widget} widget
         */
        removeChild: null,
        
        /**
         * @param {string} reason
         */
        resize: null
    },
    
    properties: {
        /**
         * @type {Element}
         */
        detachParent: {
            apply: function() {
                this.__previousSibling = null;
            }
        },
        
        /**
         * @type {string}
         */
        mod: {
            model: true
        },
        
        /**
         * @type {boolean}
         */
        rendered: {
            value: false,
            __setter: null,
            event: true
        },
        
        /**
         * @type {boolean}
         */
        shown: {
            value: true,
            model: true
        }
    },
    
    options: {
        content: {},
        id: {},
        $controller: {},
        
        /**
         * Add widget element attributes
         */
        attributes: {},
        
        /**
         * Expected type of child widget associated with section name
         * @type {Object.<string, Function|Object|string|Array>}
         */
        checkChild: {
            extend: true,
            value: {}
        },
        
        /**
         * api-ru Дополнительные классы для блока через пробел
         * api-en Additional classes for block through spacebar.
         * @type {string}
         */
        'class': {},
        
        defaults: {
            deepExtend: true,
            value: {}
        },
        ddefaults: {
            deepExtend: true,
            value: {}
        },
        
        /**
         * api-ru Метод сокрытия виджета при изменении свойства {@link #shown}.
         * api-en The method of suppressing the widget at property changing {@link #shown}.
         * @type {string}
         */
        hideMethod: {
            check: ['hide', 'detach'],
            value: 'hide'
        },
        
        /**
         * api-ru Идентификатор виджета, по которому его можно получить из родительского
         * api-en Widget ID that can be taken from the parent widget.
         * @type {string}
         */
        identifier: {},
        
        /**
         * Meta-data
         * @type {object}
         */
        meta: {
            value: {},
            deepExtend: true
        },
        
        /**
         * api-ru Секция, родительского виджета, в которой будет содержаться данный
         * api-en The section of parent widget which includes current widget.
         * @type {string}
         */
        section: {},
        
        /**
         * api-ru Css-стили корневого элемента виджета
         * api-en CSS styles of the root widget’s element.
         * @type {string}
         */
        style: {
            type: 'string'
        },
        
        /**
         * api-ru Дополнительные классы для корневого элемента
         * api-en Additional classes for the root element.
         * @type {Array.<string>}
         */
        _addClasses: {
            type: 'array',
            concat: true
        }
    },
    
    construct: function(options) {
        this.__itemsHash = {};
        this.__sections = {};
        croc.Object.prototype.construct.call(this, options);
    },
    
    destruct: function() {
        if (this.v) {
            this.v.dispose();
        }
    },
    
    members: {
        $$deferConstruct: true,
        
        /**
         * api-ru Подписаться на событие
         * api-en Listen to event
         * @param {string} eventName
         * @param {Function|Object} [callback=null]
         * @param {Object} [context=null]
         * @returns {croc.Object}
         */
        addListener: function(eventName, callback, context) {
            var propName = this['$$event-' + eventName];
            if (typeof propName === 'string') {
                callback = context ? callback.bind(context) : callback;
                callback.listener = this.model.on('change', propName, callback);
            }
            else {
                croc.cmp.Widget.superclass.addListener.apply(this, arguments);
            }
            return this;
        },
        
        /**
         * api-ru Всплывающий ресайз компонента
         * api-en Bubble component’s resizing.
         */
        bubbleResize: function() {
            var parent = this;
            var widget;
            do {
                if (!parent.getElement()) {
                    parent.onAppear(function() {
                        this.bubbleResize();
                    }, this);
                    return;
                }
                var checkResult = parent.__checkSizeChange();
                if (checkResult === null) {
                    this.__lastWidth = 0;
                    this.__lastHeight = 0;
                    return;
                }
                if (!checkResult) {
                    break;
                }
                widget = parent;
                parent = widget.__parent;
            } while (parent);
            
            if (widget) {
                widget.checkResize('bubbleResize');
            }
        },
        
        /**
         * api-ru Уведомить виджет о том, что размеры рамок изменились
         * api-ru Причины вызова метода: reposition, modelChange, render, parentResize, bubbleResize, auto
         * api-en Notify the widget that frames sizes were changed.
         * api-en Cases of access method: reposition, modelChange, render, parentResize, bubbleResize, auto.
         * @param {string} [reason]
         * @returns {boolean}
         */
        checkResize: function(reason) {
            if (this.getElement() && this.__checkSizeChange(true)) {
                this.fireEvent('resize', reason);
                this.innerResize();
                return true;
            }
            return false;
        },
        
        clearVar: function(name) {
            if (vars[name]) {
                vars[name].pop();
                if (!vars[name].length) {
                    delete vars[name];
                }
            }
        },
        
        /**
         * Generate unique id which can be used in templates
         * todo move to service
         */
        generateUniqueId: function(prefix, context) {
            if (this.__parent) {
                return this.__parent.generateUniqueId(prefix, context);
            }
            else {
                if (context && context.alias !== '#helper') {
                    context = context.parent;
                }
                if (context && context.$$generatedId) {
                    return context.$$generatedId;
                }
                if (!this.__lastUniqueId) {
                    this.__lastUniqueId = 0;
                }
                var id = (prefix || '') + (++this.__lastUniqueId);
                if (context) {
                    context.$$generatedId = id;
                }
                return id;
            }
        },
        
        /**
         * api-ru Мета-данные виджета
         * api-en Widget’s metadata
         * @returns {Object}
         */
        getMeta: function() {
            return this._options.meta;
        },
        
        getVar: function(name) {
            return _.last(vars[name]);
        },
        
        /**
         * api-ru Секция дочерних элементов по-умолчанию
         * api-en Default child elements section.
         * @return {String}
         * @protected
         */
        getDefaultItemsSection: function() {
            return 'items';
        },
        
        /**
         * api-ru Получить DOM-элемент виджета
         * api-en Get widget DOM-element.
         * @returns {jQuery}
         */
        getElement: function() {
            return this._wrapped ? this._wrapped.getElement() :
            this.__elementRaw && (this.__el || (this.__el = $(this.__elementRaw)));
        },
        
        /**
         * api-ru Идентификатор виджета
         * api-en Widget ID
         * @returns {string}
         */
        getIdentifier: function() {
            return this._options.identifier;
        },
        
        /**
         * api-ru Получить дочерний виджет по его идентификатору
         * api-en Get child widget by its ID.
         * @param {string} identifier
         * @returns {croc.cmp.Widget}
         */
        getItem: function(identifier) {
            return this.__itemsHash[identifier];
        },
        
        /**
         * api-ru Получить все дочерние виджеты
         * api-en Get all child widgets.
         * @param {string} [section=null]
         * @returns {Array.<croc.cmp.Widget>}
         */
        getItems: function(section) {
            return (this.__sections && this.__sections[section || this.getDefaultItemsSection()]) || [];
        },
        
        /**
         * api-ru Родительский виджет
         * api-en Parent widget.
         * @return {croc.cmp.Widget}
         */
        getParent: function() {
            return this.__parent;
        },
        
        /**
         * @returns {string}
         */
        getSection: function() {
            return this._options.section;
        },
        
        /**
         * Get element which is contained by the widget element
         * @param {string} id
         * @returns {jQuery}
         */
        getSubElement: function(id) {
            return this.getElement().find('.' + this.subElement(id));
        },
        
        /**
         * Get selector for the subelement
         * @param {string} id
         * @returns {string}
         */
        getSubElementSelector: function(id) {
            return '.' + this.subElement(id);
        },
        
        /**
         * Get value of parent context expression with passed alias
         */
        getValueByAlias: function(alias) {
            var context = croc.utils.forChain(this.context, 'parent', function(context) {
                if (context.alias === alias) {
                    return context;
                }
            });
            if (context) {
                return context.get();
            }
        },
        
        /**
         * api-ru Враппер виджета. Если нет то возвращает корневой элемент виджета.
         * api-en Wrapper widget. If there is no wrapper, then it returns root widget’s element. 
         * @returns {jQuery}
         */
        getWrapperElement: function() {
            if (!this.__wrapperEl) {
                this.__wrapperEl = this.getElement().parent().closest('.js-wrapper');
                if (!this.__wrapperEl.length) {
                    this.__wrapperEl = this.getElement();
                }
            }
            return this.__wrapperEl;
        },
        
        innerResize: function() {
            _.forOwn(this.__itemsHash, function(item) {
                item.checkResize('parentResize');
            });
        },
        
        /**
         * api-ru Виден ли в данный момент виджет
         * api-en If widget is visible at this moment.
         * @returns {boolean}
         */
        isVisible: function() {
            return !!this.getElement() && this.getElement().is(':visible');
        },
        
        /**
         * api-ru Если элемент виден, то callback вызывается сразу иначе на событие appear
         * api-en If element is visible, then callback is called, otherwise it returns to event 'appear'.  
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
        
        onWrapped: function(callback, context) {
            if (this._wrapped) {
                callback.call(context || global, this._wrapped);
                return _.noop;
            }
            else {
                var listener = this.on('initChild', function(item) {
                    if (item.getSection() === 'wrapped') {
                        callback.call(context || global, item);
                        listener();
                    }
                });
                return listener;
            }
        },
        
        resolveVirtualView: function(name) {
            return this._options['_pass_view_' + name] || (this.constructor.classname + ':' + name);
        },
        
        setVar: function(name, value) {
            if (!vars[name]) {
                vars[name] = [];
            }
            vars[name].push(value);
        },
        
        /**
         * Css class for subelement
         * @param {string} id
         * @returns {string}
         */
        subElement: function(id) {
            return 'js-widget' + this._options.id + '-' + id;
        },
        
        viewPassed: function(name) {
            return !!this.app.views.find(this.resolveVirtualView(name));
        },
        
        /**
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
         * @protected
         */
        _initModel: function() {
        },
        
        /**
         * api-ru Инициализация виджета после его отрисовки в DOM
         * api-en Initialization of widget after its rendering in DOM.
         * @protected
         */
        _initWidget: function() {
        },
        
        /**
         * @private
         */
        create: function() {
            var el = this.getElement();
            this.listenProperty('shown', function(value) {
                if (this._options.hideMethod === 'detach') {
                    if (!value) {
                        this.page.context.flush();
                        this.setDetachParent(el[0].parentNode);
                        this.__previousSibling = el[0].previousSibling;
                        el.detach();
                    }
                    else if (this.getDetachParent()) {
                        this.getDetachParent()
                            .insertBefore(el[0], this.__previousSibling && this.__previousSibling.nextSibling);
                    }
                }
                if (value) {
                    if (this.hasListeners('appear') && el.is(':visible')) {
                        this.fireEvent('appear');
                    }
                    var iterateChildren = function(widget) {
                        _.forOwn(widget.__itemsHash, function(item) {
                            if (item.hasListeners('appear') && item.isVisible()) {
                                item.fireEvent('appear');
                            }
                            iterateChildren(item);
                        });
                    };
                    iterateChildren(this);
                }
            }, this);
            
            this.fireEvent('beforeInitWidget');
            this._initWidget();
            this.v.onCreate();
            
            //autoresize
            if (!this.__parent) {
                this._getDisposer().addListener($(window), 'resize', function() {
                    this.checkResize('auto');
                }, this);
                this.onAppear(function() {
                    this.checkResize('render');
                }, this);
            }
            
            this.__setRendered(true);
        },
        
        /**
         * @private
         */
        destroy: function() {
            croc.cmp.Widget.superclass.destroy.apply(this, arguments);
            this.dispose();
            
            var parent = this.parent;
            if (parent && parent instanceof croc.cmp.Widget) {
                delete parent.__itemsHash[this._options.identifier];
                croc.utils.arrRemove(parent.__sections[this._options.section], this);
                parent.fireEvent('removeChild', this);
            }
        },
        
        /**
         * @private
         */
        init: function() {
            if (this.__inited) {
                //second init. copy model to attributes
                _.forOwn(this._options, function(value, key) {
                    this.setAttribute(key, value);
                }, this);
                return;
            }
            
            var model = this._model = this.model;
            var options = this.$$optionsSource = _.assign(model.data, this._options);
            var passedOptions = this._passedOptions = Object.keys(options);
            
            croc.Class.deferredConstruction(this, options);
            for (var key in model.$$attrsRefs) {
                var rootKey = model.$$attrsRefs[key];
                if (model.root.get(rootKey) !== options[key]) {
                    model.root.set(rootKey, options[key]);
                }
            }
            
            var parent = this.parent;
            var section;
            if (parent && parent instanceof croc.cmp.Widget) {
                this.__parent = parent;
                if (!options.section) {
                    model.set('section', this.getValueByAlias('#section') || parent.getDefaultItemsSection());
                }
                section = options.section;
                
                var assignDefaultOptions = function(defaults) {
                    if (defaults) {
                        _.forOwn(defaults, function(value, key) {
                            if (passedOptions.indexOf(key) === -1) {
                                options[key] = value;
                            }
                        });
                    }
                };
                assignDefaultOptions(parent._options.defaults && parent._options.defaults[options.section]);
                assignDefaultOptions(options.section === parent.getDefaultItemsSection() && parent._options.ddefaults);
            }
            
            if (!options.identifier) {
                model.set('identifier', this.generateUniqueId());
            }
            model.set('self', this.constructor.classname);
            
            if (this.__parent) {
                var check = parent._options.checkChild[section];
                if (check && !croc.Class.checkType(check, this, false)) {
                    throw new Error('Unexpected child ("' + this.constructor.classname + '") passed to section "' +
                    section + '" of widget "' + parent.constructor.classname + '"');
                }
                
                parent.__itemsHash[options.identifier] = this;
                this._model.on('change', 'identifier', function(value, old) {
                    delete parent.__itemsHash[old];
                    parent.__itemsHash[value] = this;
                }.bind(this));
                (parent.__sections[options.section] || (parent.__sections[options.section] = [])).push(this);
                
                if (section === 'wrapped') {
                    parent._wrapped = this;
                }
            }
            
            this.fireEvent('beforeInitModel', this._model);
            this._initModel();
            
            //view
            this._options.v = this.v = new (croc.cmp.Widget.getView(this.constructor))({model: model, widget: this});
            //widget
            this._options.w = this.w = this;
            //model
            this._options.m = this.m = this._options;
            
            //parent and it's view
            this.p = this.parent;
            this.pv = this.parent && this.parent.v;
            if (this.parent && this.parent._model) {
                //this._model.root.ref(this._model._at + '.pm', this.parent._model._at);
                this.pm = this.parent._options;
            }
            
            if (this.__parent) {
                this.__parent.fireEvent('initChild', this);
                if (croc.isClient) {
                    if (this.getRendered()) {
                        this.__parent.fireEvent('addChild', this);
                    }
                    else {
                        this.once('changeRendered', function() {
                            this.__parent.fireEvent('addChild', this);
                        }, this);
                    }
                }
            }
            
            this.__inited = true;
        },
        
        /**
         * @param saveSize
         * @returns {*}
         * @private
         */
        __checkSizeChange: function(saveSize) {
            if (!this.getShown()) {
                return false;
            }
            var width = this.getElement().width();
            var height = this.getElement().height();
            if (this.__lastWidth !== width || this.__lastHeight !== height) {
                if (saveSize) {
                    this.__lastWidth = width;
                    this.__lastHeight = height;
                }
                if (width === 0 && height === 0) {
                    return null;
                }
                return true;
            }
            return false;
        }
    },
    
    /**
     * api-ru Создать свойство для объекта
     * api-en Create property for object.
     * @param name
     * @param prop
     * @param dest
     * @param [Cls]
     */
    createProperty: function(name, prop, dest, Cls) {
        if (prop) {
            prop.name = name;
            if (prop.inherit) {
                croc.Class._inheritProperty(prop, Cls);
            }
        }
        
        if (!prop || !prop.model) {
            return croc.Class.createProperty.apply(croc.Class, arguments);
        }
        
        var ucfPropName = croc.utils.strUcFirst(name);
        
        //getter
        prop.getterName = 'get' + ucfPropName;
        dest[prop.getterName] = function() {
            return this._options[name];
        };
        
        //event
        prop.event = 'change' + ucfPropName;
        dest['$$event-' + prop.event] = name;
        
        //setter
        var setterPrefix = ('__setter' in prop && '__') || ('_setter' in prop && '_') || '';
        prop.setterName = setterPrefix + 'set' + ucfPropName;
        var setter = prop[setterPrefix + 'setter'];
        dest[prop.setterName] = function(value, internal) {
            var old = this._options[name];
            if (prop.transform) {
                value = (typeof prop.transform === 'function' ? prop.transform : this[prop.transform])
                    .call(this, value, old);
            }
            if (old !== value) {
                if (prop.type || prop.check) {
                    croc.Class.checkType(prop, value, true, Cls.classname, prop.name);
                }
                if (setter) {
                    setter.call(this, value, old);
                }
                else if (internal) {
                    this.model.pass(internal).set(name, value);
                }
                else {
                    this.model.set(name, value);
                }
            }
        };
        
        //add option
        var propOption = Cls.config.options[name] = {name: name};
        if ('value' in prop) {
            propOption.value = prop.value;
        }
        
        return prop;
    },
    
    onClassCreate: function(Cls) {
        Cls.$$widgetClass = true;
        croc.cmp.Widget.CLASSES.push(Cls);
    }
});

var vars = {};