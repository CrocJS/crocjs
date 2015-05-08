/**
 * Миксин добавляет свойство всплывающего элемента виджету. Изменение любых свойств позиционирования не приводит к
 * эффекту до вызова метода reposition.
 * @marker js-bubble-close закрыть bubble
 */
croc.Mixin.define('croc.cmp.common.bubble.MBubble', {
    events: {
        /**
         * Возбуждается перед каждым открытием bubble.
         * @param {jQuery|croc.cmp.Widget|Array|function} target целевой объект, на котором соверешена попытка открыть bubble
         * @param {function} prevent вызов этой функции отменяет открытие bubble
         */
        beforeOpen: null,
        
        /**
         * Возбуждается до вычисления параметров позиционирования для конкретной позиции
         */
        beforePosition: null,
        
        /**
         * Возбуждается после вычисления параметров позиционирования, но до их применения
         * @param {Object} css
         * @param {Object} jointCss
         * @param {function} prevent
         */
        beforePositionApply: null,
        
        /**
         * bubble был закрыт (возбуждается только после анимации сокрытия)
         */
        close: null,
        
        /**
         * bubble был открыт
         */
        open: null
    },
    
    properties: {
        /**
         * Смещение по горизонтали относительно центра цели
         * @type {string}
         */
        hAlign: {
            check: ['left', 'centerLeft', 'center', 'centerRight', 'right'],
            value: 'center',
            model: true
        },
        
        /**
         * Обновлять позицию по таймауту
         * @type {boolean}
         */
        keepActualPosition: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number|Array.<number>}
         */
        offset: {
            type: ['number', 'array'],
            model: true
        },
        
        /**
         * Открыт ли в данный момент тултип. true если bubble виден и нет анимации закрытия в данный момент
         * @type {boolean}
         */
        open: {
            type: 'boolean',
            value: false,
            __setter: null,
            event: true
        },
        
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            check: ['top', 'bottom', 'left', 'right', 'center'],
            model: true
        },
        
        /**
         * Объект крепления bubble. Может быть коллекцией dom-элементов, виджетом, точкой на экране (массив [x, y]),
         * прямоугольником (массив [[x1, y1], [x2, y2]]), функция - которая возвращает значение одного из предыдущих
         * типов
         * @type {jQuery|croc.cmp.Widget|Array|function}
         */
        target: {
            model: true
        },
        
        /**
         * Смещение по вертикали относительно центра цели
         * @type {string}
         */
        vAlign: {
            check: ['top', 'middleTop', 'middle', 'middleBottom', 'bottom'],
            value: 'middle',
            model: true
        },
        
        /**
         * @private
         */
        closing: {
            value: false,
            __setter: null,
            model: true
        }
    },
    
    options: {
        /**
         * Флаг, закрывать ли bubble через некоторый таймаут после открытия
         * @type {boolean}
         */
        autoClose: false,
        
        /**
         * Таймаут через который должен быть закрыт bubble
         * @type {number}
         */
        autoCloseTimeout: {
            type: 'number',
            value: 1000
        },
        
        /**
         * Автоматическое позиционирование bubble исходя из положения на экране
         * @type {boolean}
         */
        autoPositioning: false,
        
        /**
         * Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * @type {Array|Object}
         */
        autoPositioningSequence: {
            value: ['top', 'right', 'bottom', 'left']
        },
        
        /**
         * Можно ли смещать элемент
         * @type {boolean}
         */
        autoShift: true,
        
        /**
         * Размер относительно размера target
         * @type {boolean}
         */
        autoSize: false,
        
        /**
         * Как устанавливается размер (minWidth, maxWidth или width)
         * @type {string}
         */
        autoSizeKind: {
            check: ['min', 'max']
        },
        
        /**
         * Отличие от размера target, зазор между краем target и краем bubble
         */
        autoSizeGap: {
            type: ['number', 'array'],
            value: 0
        },
        
        /**
         * Флаг, закрывать ли bubble на клик по документу
         * @type {boolean}
         */
        closeOnHtmlClick: false,
        
        /**
         * Флаг, закрывать ли bubble при ресайзе окна
         * @type {boolean}
         */
        closeOnResize: false,
        
        /**
         * Флаг, закрывать ли bubble при скролле
         * @type {boolean}
         */
        closeOnScroll: false,
        
        /**
         * Управляющий виджет. При его разрушении - разрушается bubble. По-умолчанию выводится на основе target.
         * @type {croc.cmp.Widget}
         */
        controlWidget: {
            type: croc.cmp.Widget
        },
        
        /**
         * Разрушение после первого закрытия
         * @type {boolean}
         */
        destroyOnClose: false,
        
        /**
         * Флаг, позиционировать ли bubble при ресайзе/скролле
         * @type {boolean}
         */
        dynamicPositioning: false,
        
        /**
         * Запретить любое выравнивание bubble
         * @type {boolean}
         */
        forbidPositioning: false,
        
        /**
         * Анимация сокрытия
         * @type {string}
         */
        hideAnimation: {
            check: ['fade', 'fly']
        },
        
        /**
         * Метод сокрытия виджета при изменении свойства {@link #shown}.
         * @type {string}
         */
        hideMethod: 'detach',
        
        /**
         * Менеджер всплывающих элементов (или его имя), который будет отвечать за данный. Если передан объект, то
         * его поле name будет интерпретировано как имя менеджера, а остальные поля как его конфигурация.
         * @type {string|croc.cmp.common.bubble.Manager|Object}
         */
        manager: null,
        
        /**
         * Элемент или виджет, который необходимо связать с bubble связью "opener->плавающий элемент"
         * {@see croc.utils.domLinkElementToOpener}
         * @type {jQuery|croc.cmp.Widget}
         */
        opener: {},
        
        /**
         * Расстояние от края bubble до соответствующего края target
         * @type {number}
         */
        sourceDistance: 0,
        
        /**
         * Анимация всплывания
         * @type {string}
         */
        showAnimation: {
            check: ['fade', 'fly']
        },
        
        /**
         * Виден ли виджет после его рендеринга
         * @type {boolean}
         */
        shown: false,
        
        /**
         * Дополнительные классы для корневого элемента
         * @type {Array.<string>}
         */
        _addClasses: ['js-bubble'],
        
        /**
         * Расстояние от края bubble до центра target при выравнивании относительно центра
         * @type {number}
         */
        _alignGap: 0,
        
        /**
         * Минимально возможное пересечение target и bubble при смещении во время автопозиционирования
         * @type {number}
         */
        _minIntersection: 0,
        
        /**
         * При позиционировании не задавать положение левого края элемента
         */
        _skipElementLeft: false,
        
        /**
         * При позиционировании не задавать положение верхнего края элемента
         */
        _skipElementTop: false,
        
        /**
         * Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * @type {Array.<number>|function(croc.cmp.common.bubble.MBubble):Array.<number>}
         */
        screenGap: [0, 0, 0, 0],
        
        /**
         * По-умолчанию ставить zIndex верхнего слоя
         * @type {boolean}
         */
        _upperZIndexLayer: false
    },
    
    preConstruct: function(options) {
        this.__currentPosition = null;
        
        this.__showDisposer = new croc.util.Disposer();
        this.__openDisposer = new croc.util.Disposer();
        this._getDisposer().addCallback(function() {
            this.__showDisposer.disposeAll();
            this.__openDisposer.disposeAll();
        }, this);
        
        this.once('model', this.__onBubbleModel, this);
        this.once('changeRendered', function() {
            //open on demand
            if (this._openOnRender && !this.getOpen()) {
                this.open.apply(this, this._openOnRender);
            }
        }, this);
        this.on('changeShown', function(shown) {
            if (!shown) {
                this.__showDisposer.disposeAll();
            }
        }, this);
        
        //this.on('appear', function() {
        //    this.reposition();
        //    this.__repositionedOnAppear = true;
        //}, this);
        
        //this.on('resize', function(reason) {
        //    if (reason !== 'reposition') {
        //        this.reposition();
        //    }
        //}, this);
    },
    
    construct: function() {
        croc.Object.multiBind(
            this, 'shown',
            this, 'closing',
            this, '__open',
            function(shown, closing) {
                return shown && !closing;
            });
    },
    
    members: {
        /**
         * Скрыть bubble
         * @param {boolean} [quick=false] закрыть без анимации
         */
        close: function(quick) {
            if (Stm.env.freezeBubbles) {
                return;
            }
            if (!this.getRendered()) {
                this._openOnRender = false;
                return;
            }
            
            if (!this.getShown() || (!quick && this.getClosing())) {
                return;
            }
            
            this._model.set('onClose', {quick: quick});
            this.__openDisposer.disposeAll();
        },
        
        deferredClose: function() {
            this._getDisposer().defer(this.close, this);
        },
        
        /**
         * Возвращает текущую позицию bubble (совпадает с #getPosition() если автопозиционирование отключено)
         * @returns {string}
         */
        getCurrentPosition: function() {
            return this._model.get('currentPosition') || this.getPosition();
        },
        
        /**
         * Возвращает элемент, на котором в данный момент был открыт bubble
         * @param {boolean} [elementOnly=false]
         * @returns {jQuery|Array}
         */
        getCurrentTarget: function(elementOnly) {
            var curTarget = this._model.get('currentTarget');
            return curTarget && elementOnly && !(curTarget instanceof jQuery) ? null : curTarget;
        },
        
        /**
         * Disposer, который очищается при попытке закрыть bubble
         * @returns {croc.util.Disposer}
         * @protected
         */
        getOpenDisposer: function() {
            return this.__openDisposer;
        },
        
        getScreenGap: function() {
            var gap = this._options.screenGap;
            return typeof gap === 'function' ? (options.screenGap = gap(this)) : gap;
        },
        
        /**
         * Disposer, который очищается, когда bubble становится невидимым
         * @returns {croc.util.Disposer}
         * @protected
         */
        getShowDisposer: function() {
            return this.__showDisposer;
        },
        
        /**
         * Слой, на котором лежит bubble
         * @returns {string}
         */
        getZIndexLayer: function() {
            return this._model.get('zIndexLayer');
        },
        
        /**
         * Показать bubble. Если тултип был открыт, то возвращает true.
         * @returns {boolean}
         */
        open: function() {
            if (!this.getRendered()) {
                this._openOnRender = _.toArray(arguments);
                return false;
            }
            
            if (!this.getTarget()) {
                return false;
            }
            
            if (this.getOpen()) {
                return true;
            }
            
            var dontOpen = false;
            var preventOpen = function() {dontOpen = true;};
            this._model.increment('onBeforeOpen');
            this.fireEvent('beforeOpen', this.getTarget(), preventOpen);
            
            if (dontOpen) {
                this.__openDisposer.disposeAll();
                this.__showDisposer.disposeAll();
                return false;
            }
            
            this._model.increment('onOpen');
            
            return true;
        },
        
        /**
         * Пересчитать позицию
         */
        reposition: function() {
            if (!this.getShown() || this._options.forbidPositioning) {
                return;
            }
            
            this._model.increment('onReposition');
        },
        
        /**
         * Открыть/закрыть bubble
         * @param open
         */
        setOpen: function(open) {
            if (this.getOpen() !== open) {
                if (open) {
                    this.open();
                }
                else {
                    this.close();
                }
            }
        },
        
        /**
         * Закрыть bubble по прошествию указанного промежутка времени
         * @param {number} [timeout]
         * @protected
         */
        startCloseTimeout: function(timeout) {
            if (this._options.autoClose || timeout) {
                this.stopCloseTimeout();
                this.__closeTimeout = this.__showDisposer.setTimeout(function() {
                    this.__closeTimeout = null;
                    this.close();
                }.bind(this), timeout || this._options.autoCloseTimeout);
            }
        },
        
        /**
         * Остановить таймер автозакрытия
         * @protected
         */
        stopCloseTimeout: function() {
            if (this.__closeTimeout) {
                this.__closeTimeout.remove();
                this.__closeTimeout = null;
            }
        },
        
        /**
         * @returns {jQuery}
         * @private
         */
        __getTargetEl: function() {
            var target = this.getTarget();
            return !target ? null :
                target instanceof croc.cmp.Widget ? target.getElement() :
                    target instanceof jQuery ? target : null;
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @private
         */
        __onBubbleModel: function() {
            var options = this._options;
            this.__opener = options.opener;
            var targetEl = this.__getTargetEl();
            
            if (!options.controlWidget && targetEl) {
                options.controlWidget = croc.cmp.Widget.getClosestWidget(targetEl);
            }
            
            if (options.opener && !options.controlWidget) {
                //(!options.controlWidget || options.controlWidget === croc.cmp.WidgetsManager.getPageWidget())) {
                options.controlWidget = (options.opener instanceof croc.cmp.Widget) ?
                    options.opener : croc.cmp.Widget.getClosestWidget(options.opener);
            }
            //else if (!options.controlWidget) {
            //    options.controlWidget = croc.cmp.WidgetsManager.getPageWidget();
            //}
            
            //todo разобрать с этим
            if (options.controlWidget) {
                this._getDisposer().addListener(options.controlWidget, 'dispose', function() {
                    this.destroy();
                }, this);
            }
            
            //close on parent bubble close
            var placeEl = targetEl || (options.opener ?
                    croc.cmp.Widget.resolveElement(options.opener) :
                options.controlWidget && options.controlWidget.getElement());
            
            if (placeEl) {
                var parentBubbleEl = placeEl.closest('.js-bubble');
                var parentBubble = parentBubbleEl.length && croc.cmp.Widget.getByElement(parentBubbleEl);
                if (parentBubble) {
                    this._getDisposer().addListener(parentBubble, 'changeOpen', function(open) {
                        if (!open) {
                            this.close(true);
                        }
                    }, this);
                }
            }
            
            if (options.manager) {
                var manager;
                if (typeof options.manager === 'string') {
                    manager = croc.cmp.common.bubble.Manager.getInstance(options.manager);
                }
                else if (options.manager instanceof croc.cmp.common.bubble.Manager) {
                    manager = options.manager;
                }
                else {
                    var name = options.manager.name;
                    delete options.manager.name;
                    manager = croc.cmp.common.bubble.Manager.getInstance(name, options.manager);
                }
                
                manager.addItem(this);
            }
        }
    }
});
