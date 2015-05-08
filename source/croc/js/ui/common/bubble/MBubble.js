/**
 * Миксин добавляет свойство всплывающего элемента виджету. Изменение любых свойств позиционирования не приводит к
 * эффекту до вызова метода reposition.
 * Не забудьте вызывать метод {@link croc.ui.common.bubble.MBubble#_onPropertiesInitialized}
 * @marker js-bubble-close закрыть bubble
 */
croc.Mixin.define('croc.ui.common.bubble.MBubble', {
    statics: {
        /**
         * @private
         * @static
         */
        __BUBBLE_SELECTOR: '.js-bubble, .b-popup, .b-tooltip',
        
        /**
         * @private
         * @static
         */
        __FLY_OFFSET: 50
    },
    
    events: {
        beforeClose: null,
        
        /**
         * Возбуждается перед каждым открытием bubble.
         * @param {jQuery|croc.ui.Widget|Array|function} target целевой объект, на котором соверешена попытка открыть bubble
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
            option: true
        },
        
        /**
         * Обновлять позицию по таймауту
         * @type {boolean}
         */
        keepActualPosition: {
            type: 'boolean',
            value: false,
            apply: '__applyKeepActualPosition',
            option: true
        },
        
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number|Array.<number>}
         */
        offset: {
            type: ['number', 'array'],
            option: true
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
            option: true
        },
        
        /**
         * Позиционирование бабла внутри таргета
         * @type {boolean}
         */
        positionInset: {
            type: 'boolean',
            value: false,
            option: true
        },
        
        /**
         * Объект крепления bubble. Может быть коллекцией dom-элементов, виджетом, точкой на экране (массив [x, y]),
         * прямоугольником (массив [[x1, y1], [x2, y2]]), функция - которая возвращает значение одного из предыдущих
         * типов
         * @type {jQuery|croc.ui.Widget|Array|function}
         */
        target: {
            option: true
        },
        
        /**
         * Смещение по вертикали относительно центра цели
         * @type {string}
         */
        vAlign: {
            check: ['top', 'middleTop', 'middle', 'middleBottom', 'bottom'],
            value: 'middle',
            option: true
        },
        
        /**
         * @private
         */
        closing: {
            value: false,
            __getter: null,
            __setter: null,
            event: true
        }
    },
    
    options: {
        /**
         * Show/hide animation duration
         * @type {number}
         */
        animationDuration: 200,
        
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
         * @type {boolean}
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
         * Функция произвольного позиционирования бабла. Параметры:
         * bubble
         * bubbleCss - пустой объект, который следует заполнить css-свойствами для bubble
         * jointCss - пустой объект, который можно заполнить css-свойствами для joint
         * @type {function(croc.ui.common.bubble.MBubble, Object, Object)}
         */
        customReposition: {},
        
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
         * @type {croc.ui.Widget}
         */
        controlWidget: {
            type: croc.ui.Widget
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
            check: ['fade', 'fly', 'slide']
        },
        
        /**
         * Hide animation delay
         * @type {number}
         */
        hideAnimationDelay: {},
        
        /**
         * Метод сокрытия виджета при изменении свойства {@link #shown}.
         * @type {string}
         */
        hideMethod: 'detach',
        
        /**
         * Менеджер всплывающих элементов (или его имя), который будет отвечать за данный. Если передан объект, то
         * его поле name будет интерпретировано как имя менеджера, а остальные поля как его конфигурация.
         * @type {string|croc.ui.common.bubble.Manager|Object}
         */
        manager: null,
        
        /**
         * Элемент или виджет, который необходимо связать с bubble связью "opener->плавающий элемент"
         * {@see croc.utils.domLinkElementToOpener}
         * @type {jQuery|croc.ui.Widget}
         */
        opener: {},
        
        /**
         * Элемент-контейнер виджета. Передаётся если разметка виджета должна быть создана динамически.
         * @type {string|Element|jQuery}
         */
        renderTo: 'body',
        
        /**
         * Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * @type {Array.<number>|function(croc.ui.common.bubble.MBubble):Array.<number>}
         */
        screenGap: [0, 0, 0, 0],
        
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
            check: ['fade', 'fly', 'slide']
        },
        
        /**
         * Show animation delay
         * @type {number}
         */
        showAnimationDelay: {},
        
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
        
        this.once('changeRendered', this.__onBubbleRendered, this);
        
        this.on('appear', function() {
            this.reposition();
            this.__repositionedOnAppear = true;
        }, this);
        
        this.on('resize', function(reason) {
            if (reason !== 'reposition') {
                this.reposition();
            }
        }, this);
    },
    
    construct: function() {
        croc.Object.multiBind(
            this, 'shown',
            this, '__closing',
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
            
            if (!this.getShown() || (!quick && this.__getClosing())) {
                return;
            }
            
            this.fireEvent('beforeClose');
            this.__opening = false;
            this.__setClosing(false);
            
            var hideAnimation = !quick && this._options.hideAnimation;
            
            this.__fixMobileTapFall();
            
            if (hideAnimation) {
                this.__hideAnimation(hideAnimation);
            }
            else {
                this.getWrapperElement().stop(true);
                this.setShown(false);
            }
            
            this.__openDisposer.disposeAll();
            this.__currentPosition = null;
            this.__currentTarget = null;
        },
        
        /**
         * Закрыть bubble по прошествию указанного промежутка времени
         * @param {number} [timeout]
         */
        closeIn: function(timeout) {
            this.startCloseTimeout(timeout);
        },
        
        /**
         * Возвращает текущую позицию bubble (совпадает с #getPosition() если автопозиционирование отключено)
         * @returns {string}
         */
        getCurrentPosition: function() {
            return this.__currentPosition || this.getPosition();
        },
        
        /**
         * Возвращает элемент, на котором в данный момент был открыт bubble
         * @param {boolean} [elementOnly=false]
         * @returns {jQuery|Array}
         */
        getCurrentTarget: function(elementOnly) {
            return this.__currentTarget && elementOnly && !(this.__currentTarget instanceof jQuery) ? null :
                this.__currentTarget;
        },
        
        /**
         * Слой, на котором лежит bubble
         * @returns {string}
         */
        getZIndexLayer: function() {
            return this.__zIndexLayer;
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
            
            this.__initParentBubble();
            
            var dontOpen = false;
            if (!this.getTarget() || this.__parentBubble && this.__parentBubble.__getClosing()) {
                dontOpen = true;
            }
            else {
                var preventOpen = function() {dontOpen = true;};
                this.__resolveTarget(true);
                this.fireEvent('beforeOpen', this.getTarget(), preventOpen);
            }
            
            if (dontOpen) {
                this.__currentTarget = null;
                this._getOpenDisposer().disposeAll();
                this._getShowDisposer().disposeAll();
                return false;
            }
            
            var showAnimation = this._options.showAnimation;
            var element = this.getWrapperElement();
            
            if (showAnimation) {
                element.css('opacity', 0);
            }
            
            element.css({visibility: 'hidden'});
            if (!this._options.forbidPositioning) {
                element.css({left: 0, top: 0});
            }
            
            this.__repositionedOnAppear = false;
            this.setShown(true);
            if (!this.__repositionedOnAppear) {
                this.reposition();
            }
            
            element.css('visibility', '');
            
            this.__setClosing(false);
            this.fireEvent('open');
            
            //animate
            if (showAnimation) {
                this.__showAnimation(showAnimation);
            }
            else {
                element.css('opacity', 1);
                element.stop(true);
            }
            
            this.startCloseTimeout();
            
            return true;
        },
        
        /**
         * Пересчитать позицию
         */
        reposition: function() {
            var options = this._options;
            if (!this.getShown()) {
                return;
            }
            
            var hostElements = this._getHostElements();
            if (!this.__opener && hostElements) {
                croc.utils.domLinkElementToOpener(this.getWrapperElement(), hostElements);
            }
            
            if (options.forbidPositioning) {
                this.fireEvent('beforePosition');
                this.fireEvent('beforePositionApply', this.getElement().offset(), {}, function() {});
                return;
            }
            
            var bubbleCss = {};
            var jointCss = {};
            
            if (options.customReposition) {
                this.fireEvent('beforePosition');
                options.customReposition(this, bubbleCss, jointCss);
            }
            else {
                var parent = this._getHostElements();
                parent = parent ? parent.eq(0) : this.__openerEl;
                if (parent && parent[0] !== window && parent[0] !== document.documentElement) {
                    while (parent && parent.length && parent[0] !== document.body) {
                        if (parent.css('position') === 'fixed') {
                            this.getWrapperElement().css('position', 'fixed');
                            this.__fixedHost = parent;
                            break;
                        }
                        parent = parent.parent();
                    }
                }
                this.__isFixed = this.getWrapperElement().css('position') === 'fixed';
                this.__nativeReposition(bubbleCss, jointCss);
            }
            
            this._setZIndex();
            
            if (options._skipElementLeft) {
                delete bubbleCss.left;
            }
            if (options._skipElementTop) {
                delete bubbleCss.top;
            }
            
            var prevented = false;
            this.fireEvent('beforePositionApply', bubbleCss, jointCss, function() { prevented = true; });
            if (prevented) {
                return;
            }
            
            this.getElement().css(bubbleCss);
            var jointEl = this._getJointEl();
            if (jointEl && !_.isEmpty(jointCss)) {
                jointEl.css(jointCss);
            }
            
            this.onResize('reposition');
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
         * Запустить таймер автозакрытия
         * @param {number} [timeout]
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
         */
        stopCloseTimeout: function() {
            if (this.__closeTimeout) {
                this.__closeTimeout.remove();
                this.__closeTimeout = null;
            }
        },
        
        /**
         * Adjust coordinates for fixed bubble/target and for scrolled area
         * @param {{left: number, top: number}|boolean} [coors]
         * @param {boolean} [container=false]
         * @returns {{left: number, top: number}}
         * @protected
         */
        _adjustCoorsForScrolling: function(coors, container) {
            if (typeof coors !== 'object') {
                container = coors;
                coors = {left: 0, top: 0};
            }
            if (container) {
                coors.left -= $(window).scrollLeft();
                coors.top -= $(window).scrollTop();
                if (this.__isFixed) {
                    var delta = this._adjustCoorsForScrolling();
                    coors.left -= delta.left;
                    coors.top -= delta.top;
                }
            }
            else if (this.__isFixed) {
                var hostOffset = this.__fixedHost && this.__fixedHost.offset();
                coors.left -= !this.__fixedHost ? $(window).scrollLeft() :
                hostOffset.left - croc.utils.domNumericCss(this.__fixedHost, 'left');
                coors.top -= !this.__fixedHost ? $(window).scrollTop() :
                hostOffset.top - croc.utils.domNumericCss(this.__fixedHost, 'top');
            }
            return coors;
        },
        
        /**
         * Элемент отвечающий за размеры bubble
         * @returns {jQuery}
         * @protected
         */
        _getSizeableElement: function() {
            return this.getElement();
        },
        
        /**
         * Возвращает коллекцию элементов, к которым в данный момент прикреплён bubble
         * @returns {jQuery}
         * @protected
         */
        _getHostElements: function() {
            return this.__currentTarget instanceof jQuery ? this.__currentTarget : null;
        },
        
        /**
         * Возвращает элемент точки крепления. Например, стрелка тултипа.
         * @returns {jQuery}
         * @protected
         */
        _getJointEl: function() {
            return null;
        },
        
        /**
         * Disposer, который очищается при попытке закрыть bubble
         * @returns {croc.util.Disposer}
         * @protected
         */
        _getOpenDisposer: function() {
            return this.__openDisposer;
        },
        
        /**
         * Disposer, который очищается, когда bubble становится невидимым
         * @returns {croc.util.Disposer}
         * @protected
         */
        _getShowDisposer: function() {
            return this.__showDisposer;
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         * @protected
         */
        _isClosingOnHtmlClickAllowed: function(targetEl) {
            return targetEl.closest(document.body).length &&
                (!croc.utils.domIsElementOpenerOf(this.getElement(), targetEl)) &&
                (!targetEl.closest(this.getElement()).length);
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__opener = options.opener;
            var targetEl = this.__getTargetEl();
            
            if (!options.controlWidget && targetEl) {
                options.controlWidget = croc.ui.Widget.getClosestWidget(targetEl);
            }
            
            if (options.opener &&
                (!options.controlWidget || options.controlWidget === croc.ui.WidgetsManager.getPageWidget())) {
                options.controlWidget = (options.opener instanceof croc.ui.Widget) ?
                    options.opener : croc.ui.Widget.getClosestWidget(options.opener);
            }
            else if (!options.controlWidget) {
                options.controlWidget = croc.ui.WidgetsManager.getPageWidget();
            }
            
            if (options.controlWidget) {
                this._getDisposer().addListener(options.controlWidget, 'dispose', function() {
                    this.destroy();
                }, this);
            }
            
            if (options.manager) {
                var manager;
                if (typeof options.manager === 'string') {
                    manager = croc.ui.common.bubble.Manager.getInstance(options.manager);
                }
                else if (options.manager instanceof croc.ui.common.bubble.Manager) {
                    manager = options.manager;
                }
                else {
                    var name = options.manager.name;
                    delete options.manager.name;
                    manager = croc.ui.common.bubble.Manager.getInstance(name, options.manager);
                }
                
                manager.addItem(this);
            }
        },
        
        /**
         * Назначить элементу z-index
         * @protected
         */
        _setZIndex: function() {
            var hostElements = this._getHostElements();
            
            //Берём ближайший к таргету родительский bubble (MBubble или b-tooltip или b-popup)
            var targetBubble = hostElements && hostElements.closest(croc.ui.common.bubble.MBubble.__BUBBLE_SELECTOR);
            
            //Если bubble есть, то проверяем лежит ли он внутри оверлэя
            var curZIndexTarget;
            if (hostElements || this.__openerEl) {
                var curParent = hostElements ? hostElements.eq(0) : this.__openerEl;
                while ((curParent = curParent.parent()) && curParent.length && curParent[0] !== document.body) {
                    
                    if (!isNaN(_.parseInt(curParent.css('zIndex')))) {
                        curZIndexTarget = curParent;
                    }
                }
            }
            if (!curZIndexTarget) {
                curZIndexTarget = hostElements;
            }
            
            //Берём z-index у полученного элемента
            var curTargetZIndex = curZIndexTarget &&
                curZIndexTarget instanceof jQuery && curZIndexTarget[0] !== window &&
                _.parseInt(curZIndexTarget.css('zIndex'));
            if (!curTargetZIndex || isNaN(curTargetZIndex)) {
                curTargetZIndex = 0;
            }
            
            //берём z-index элемента текущего bubble
            var elZIndex = _.parseInt(this.getWrapperElement().css('zIndex'));
            if (!elZIndex || isNaN(elZIndex)) {
                elZIndex = 0;
            }
            
            //Если z-index не нужно менять, то завершаем метод
            if (this.__zIndexWasSet && hostElements === this.__lastZIndexTarget && elZIndex > curTargetZIndex) {
                return;
            }
            
            if (this._options._upperZIndexLayer) {
                this.__zIndexLayer = 'popup';
            }
            else if (hostElements && hostElements instanceof jQuery) {
                //если target не лежит внутри какого-либо bubble, то кладём текущий bubble на нижний слой
                if (!targetBubble.length) {
                    this.__zIndexLayer = 'page';
                }
                else {
                    //иначе пытаемся получить виджет targetBubble. Если он также реализует IBubble, узнаём на каком слое
                    //он лежит (getZIndexLayer) и если он лежит на нижнем слое, то кладём текущий bubble также на нижний слой.
                    //Если нет или если он не реализует IBubble, то кладём на верхний слой
                    var bubbleWidget = croc.ui.Widget.getByElement(targetBubble);
                    this.__zIndexLayer =
                        (bubbleWidget && croc.Interface.check(bubbleWidget, 'croc.ui.common.bubble.IBubble') &&
                        bubbleWidget.getZIndexLayer()) || 'popup';
                }
            }
            else {
                //если target отсутствует, то кладём bubble на слой page
                this.__zIndexLayer = 'page';
            }
            
            this.__lastZIndexTarget = hostElements;
            this.__zIndexWasSet = true;
            
            //назначаем новый z-index текущему bubble, удостоверяемся, что он больше чем z-index у target
            this.getWrapperElement().css('zIndex',
                Math.max(croc.utils.getZIndex(this.__zIndexLayer), curTargetZIndex + 1));
        },
        
        /**
         * @param value
         * @private
         */
        __applyKeepActualPosition: function(value) {
            if (value) {
                if (this.getShown()) {
                    this.__keepActualPositionInterval =
                        this.__showDisposer.setInterval(function() {
                            if (!this.__opening && !this.__getClosing()) {
                                this.reposition();
                            }
                        }.bind(this), 15);
                }
            }
            else if (this.__keepActualPositionInterval) {
                this.__keepActualPositionInterval.remove();
                this.__keepActualPositionInterval = null;
            }
        },
        
        /**
         * Fixes the case when tap falls through bubble when it's closing
         * @private
         */
        __fixMobileTapFall: function() {
            if (Stm.env.device !== 'desktop') {
                var element = this.getWrapperElement();
                var elOffset = element.offset();
                this._adjustCoorsForScrolling(elOffset);
                
                var overlay = $('<div></div>').css({
                    position: element.css('position'),
                    zIndex: element.css('zIndex'),
                    left: elOffset.left,
                    top: elOffset.top,
                    width: element.outerWidth(),
                    height: element.outerHeight()
                }).appendTo('body');
                overlay.delay(400).queue(function() {
                    overlay.remove();
                });
            }
        },
        
        /**
         * @returns {jQuery}
         * @private
         */
        __getTargetEl: function() {
            var target = this.getTarget();
            return !target ? null :
                target instanceof croc.ui.Widget ? target.getElement() :
                    target instanceof jQuery ? target : null;
        },
        
        /**
         * @param type
         * @private
         */
        __hideAnimation: function(type) {
            var element = this.getWrapperElement();
            var curPos = !this.__currentPosition || this.__currentPosition === 'center' ? 'top' : this.__currentPosition;
            var animation = {};
            var axis = curPos === 'left' || curPos === 'right' ? 'left' : 'top';
            
            this.__setClosing(true);
            
            switch (type) {
                case 'fly':
                    animation.opacity = 0;
                    var shift = (curPos === 'left' || curPos === 'top' ? -1 : 1) * croc.ui.common.bubble.MBubble.__FLY_OFFSET;
                    animation[axis] = parseInt(element.css(axis), 10) + shift;
                    break;
                
                case 'slide':
                    animation = {top: -element.height()};
                    break;
                
                case 'fade':
                    animation.opacity = 0;
            }
            
            element.stop(true);
            if (this._options.hideAnimationDelay) {
                element.delay(this._options.hideAnimationDelay);
            }
            element.animate(animation, this._options.animationDuration, function() {
                this.setShown(false);
                this.__setClosing(false);
            }.bind(this));
        },
        
        /**
         * @param elWidth
         * @param elHeight
         * @returns {number}
         * @private
         */
        __getAlignShift: function(elWidth, elHeight) {
            if (this.__currentPosition === 'center') {
                return 0;
            }
            
            var options = this._options;
            var leftOrRight = this.__currentPosition === 'left' || this.__currentPosition === 'right';
            var align = leftOrRight ? this.getVAlign() : this.getHAlign();
            if (['top', 'left', 'bottom', 'right', 'center', 'middle'].indexOf(align) !== -1 ||
                elHeight < options._alignGap * 2) {
                return 0;
            }
            
            var elLength = leftOrRight ? elHeight : elWidth;
            var shift = elLength / 2 - options._alignGap;
            if (align === 'centerLeft' || align === 'middleTop') {
                shift = -shift;
            }
            
            return shift;
        },
        
        /**
         * @returns {{left: number, top: number}}
         * @private
         */
        __getWindowOffset: function() {
            var win = $(window);
            return this.getElement().closest('.b-overlay').length ?
            {left: 0, top: 0} : {left: win.scrollLeft(), top: win.scrollTop()};
        },
        
        /**
         * @private
         */
        __initParentBubble: function() {
            //close on parent bubble close
            [
                this.__getTargetEl(),
                this.__openerEl,
                this._options.controlWidget && this._options.controlWidget.getElement()
            ]
                .some(function(placeEl) {
                    if (placeEl) {
                        var parentBubbleEl = placeEl.closest('.js-bubble');
                        var parentBubble = parentBubbleEl.length && croc.ui.Widget.getByElement(parentBubbleEl);
                        if (parentBubble) {
                            this.__parentBubble = parentBubble;
                            this.__openDisposer.addListener(parentBubble, 'beforeClose', function() {
                                this.close(true);
                            }, this);
                            return true;
                        }
                    }
                }, this);
        },
        
        /**
         * @private
         */
        __nativeReposition: function(bubbleCss, jointCss) {
            var curPos = this.__currentPosition = this.getPosition();
            var options = this._options;
            
            if (typeof options.screenGap === 'function') {
                options.screenGap = options.screenGap(this);
            }
            
            var sequence = options.autoPositioning ? options.autoPositioningSequence : [curPos];
            if (!Array.isArray(sequence)) {
                if (sequence[curPos]) {
                    sequence = [curPos].concat(sequence[curPos]);
                }
                else {
                    sequence = sequence.other;
                }
            }
            
            var minIntersection = options._minIntersection;
            var element = this.getElement();
            
            //лучшая из рассмотренных позиций по процентному соотношению: видимая площадь bubble к общей площади
            var bestPosition = null;
            var bestPositionValue = 0;
            
            /**
             * Смещаем тултип влево, чтобы он принял правильную ширину
             */
            if (!options._skipElementLeft) {
                element.css('left', 0);
            }
            
            //проходим по всем позициям из autoPositioningSequence и вычисляем наилучшую позицию для bubble
            //при position == left или right - главная ось X, вторая ось Y
            //при position == top или bottom - главная ось Y, вторая ось X
            for (var i = 0; i <= sequence.length; ++i) {
                var lastPos = i === sequence.length || !options.autoPositioning;
                if (lastPos && options.autoPositioning && bestPosition) {
                    //для последнего шага мы берём лучшую из ранее вычисленных позиций
                    curPos = this.__currentPosition = bestPosition;
                }
                else if (i > 0) {
                    //берём следующую позицию для рассмотрения
                    curPos = this.__currentPosition = sequence[sequence.indexOf(curPos) + 1] || sequence[0];
                }
                else if (options.autoPositioning && sequence.indexOf(curPos) === -1) {
                    curPos = this.__currentPosition = sequence[0];
                }
                
                _.assign(jointCss, {left: '', top: ''});
                
                this.fireEvent('beforePosition');
                
                //todo optimize здесь можно оптимизировать
                var target = this.__resolveTarget();
                
                //переменная содержит потенциальное значение для bestPositionValue. Если переменная отлична от null
                //значит для данной позиции bubble не вмещается на экран полностью.
                var continueWith = 1;
                var isCenter = curPos === 'center';
                var leftOrRight = curPos === 'left' || curPos === 'right';
                var inset = this.getPositionInset();
                
                //расстояние от края target до края bubble
                var distance = this.getOffset() || 0;
                //смещение target относительно bubble
                var secondDistance = 0;
                if (Array.isArray(distance)) {
                    secondDistance = distance[1];
                    distance = distance[0];
                }
                
                //вычисляем размер bubble
                this.__repositionAutoSize(options, isCenter, leftOrRight, target);
                var elHeight = element.outerHeight();
                var elWidth = element.outerWidth();
                
                //позиционируем bubble по главной оси
                switch (curPos) {
                    case 'top':
                        bubbleCss.top = target.top - distance - options.sourceDistance - elHeight;
                        if (inset) {
                            bubbleCss.top += target.height;
                        }
                        break;
                    
                    case 'bottom':
                        bubbleCss.top = target.top + target.height + distance + options.sourceDistance;
                        if (inset) {
                            bubbleCss.top -= target.height;
                        }
                        break;
                    
                    case 'left':
                        bubbleCss.left = target.left - distance - options.sourceDistance - elWidth;
                        if (inset) {
                            bubbleCss.left += target.width;
                        }
                        break;
                    
                    case 'right':
                        bubbleCss.left = target.left + target.width + distance + options.sourceDistance;
                        if (inset) {
                            bubbleCss.left -= target.width;
                        }
                        break;
                    
                    case 'center':
                        bubbleCss.left = target.left + target.width / 2 - elWidth / 2 + distance;
                        bubbleCss.top = target.top + target.height / 2 - elHeight / 2 + secondDistance;
                        if (options.autoShift) {
                            var windowOffset = this.__getWindowOffset();
                            bubbleCss.left = Math.max(windowOffset.left + options.screenGap[3], bubbleCss.left);
                            bubbleCss.top = Math.max(windowOffset.top + options.screenGap[0], bubbleCss.top);
                        }
                        
                        //todo здесь потенциально может быть ошибка, если !options.autoShift
                        var elParent = element.parent();
                        if (elParent[0] !== document.body) {
                            bubbleCss.left =
                                Math.max(bubbleCss.left - croc.utils.domNumericCss(elParent, 'paddingLeft'), 0);
                            bubbleCss.top =
                                Math.max(bubbleCss.top - croc.utils.domNumericCss(elParent, 'paddingTop'), 0);
                        }
                        
                        break;
                }
                
                if (curPos === 'center') {
                    break;
                }
                
                //позиционируем bubble по второй оси
                if (!leftOrRight) {
                    bubbleCss.left = this.getHAlign() === 'left' ? target.left :
                        this.getHAlign() === 'right' ? target.left + target.width - elWidth :
                        target.left + target.width / 2 - elWidth / 2;
                    bubbleCss.left += secondDistance;
                }
                else {
                    bubbleCss.top = this.getVAlign() === 'top' ? target.top :
                        this.getVAlign() === 'bottom' ? target.top + target.height - elHeight :
                        target.top + target.height / 2 - elHeight / 2;
                    bubbleCss.top += secondDistance;
                }
                
                //позиционируем стрелку
                _.assign(jointCss, {
                    left: leftOrRight ? '' :
                        this.getHAlign() === 'right' ?
                            Math.min(Math.max(elWidth - target.width / 2, minIntersection),
                                elWidth - minIntersection) :
                            this.getHAlign() === 'left' ?
                                Math.max(Math.min(target.width / 2, elWidth - minIntersection), minIntersection) :
                            elWidth / 2,
                    top: !leftOrRight ? '' :
                        this.getVAlign() === 'bottom' ?
                            Math.min(Math.max(elHeight - target.height / 2, minIntersection),
                                elHeight - minIntersection) :
                            this.getVAlign() === 'top' ?
                                Math.max(Math.min(target.height / 2, elHeight - minIntersection), minIntersection) :
                            elHeight / 2
                });
                
                var shift = this.__getAlignShift(elWidth, elHeight);
                
                //проверяем вмещается ли bubble на экран полностью.
                //Если он не вмещается по главной оси, то мы рассмотрим следующую позицию позже.
                //Если он не вмещается по второй оси, то назначаем смещение (shift) достаточное для того, чтобы вместить его
                //либо если это невозможно, то рассмотрим следующую позицию позже
                var winWidth = $(window).innerWidth() - options.screenGap[1];
                var winHeight = $(window).innerHeight() - options.screenGap[2];
                var winOffset = {
                    left: bubbleCss.left + (leftOrRight ? 0 : shift),
                    top: bubbleCss.top + (leftOrRight ? shift : 0)
                };
                this._adjustCoorsForScrolling(winOffset, true);
                
                if (winOffset.left < options.screenGap[3]) {
                    if (!leftOrRight && options.autoShift) {
                        shift += options.screenGap[3] - winOffset.left;
                    }
                    else if ((!leftOrRight || curPos === 'left') && !lastPos) {
                        continueWith *= (elWidth - options.screenGap[3] + winOffset.left) / elWidth;
                    }
                }
                else if (winOffset.left + elWidth > winWidth) {
                    if (!leftOrRight && options.autoShift) {
                        shift += winWidth - (winOffset.left + elWidth);
                    }
                    else if ((!leftOrRight || curPos === 'right') && !lastPos) {
                        continueWith *= (winWidth - winOffset.left) / elWidth;
                    }
                }
                
                if (winOffset.top < options.screenGap[0]) {
                    if (leftOrRight && options.autoShift) {
                        shift += options.screenGap[0] - winOffset.top;
                    }
                    else if ((leftOrRight || curPos === 'top') && !lastPos) {
                        continueWith *= (elHeight - options.screenGap[0] + winOffset.top) / elHeight;
                    }
                }
                else if (winOffset.top + elHeight > winHeight) {
                    if (leftOrRight && options.autoShift) {
                        shift += winHeight - (winOffset.top + elHeight);
                    }
                    else if ((leftOrRight || curPos === 'bottom') && !lastPos) {
                        continueWith *= (winHeight - winOffset.top) / elHeight;
                    }
                }
                //
                
                //Если из-за смещения (shift) target и bubble перестают пересекаться по второй оси, то рассматриваем
                //следующую позицию. Иначе - задаём css-стили для точки крепления (если она есть).
                if (shift) {
                    if (!leftOrRight) {
                        bubbleCss.left += shift;
                        
                        if (bubbleCss.left + minIntersection > target.left + target.width ||
                            bubbleCss.left + elWidth - minIntersection < target.left) {
                            if (lastPos) {
                                bubbleCss.left = Math.max(
                                    Math.min(bubbleCss.left, target.left + target.width - minIntersection),
                                    target.left + minIntersection - elWidth
                                );
                            }
                            else {
                                continue;
                            }
                        }
                        
                        _.assign(jointCss, {
                            left: Math.max(
                                minIntersection,
                                Math.min(elWidth - minIntersection, jointCss.left - shift)
                            ),
                            top: ''
                        });
                    }
                    else {
                        bubbleCss.top += shift;
                        
                        if (bubbleCss.top + minIntersection > target.top + target.height ||
                            bubbleCss.top + elHeight - minIntersection < target.top) {
                            if (lastPos) {
                                bubbleCss.top = Math.max(
                                    Math.min(bubbleCss.top, target.top + target.height - minIntersection),
                                    target.top + minIntersection - elHeight
                                );
                            }
                            else {
                                continue;
                            }
                        }
                        
                        _.assign(jointCss, {
                            left: '',
                            top: Math.max(
                                minIntersection,
                                Math.min(elHeight - minIntersection, jointCss.top - shift)
                            )
                        });
                    }
                }
                
                if (options.autoPositioning && continueWith !== 1) {
                    if (continueWith > bestPositionValue) {
                        bestPosition = curPos;
                        bestPositionValue = continueWith;
                    }
                }
                else {
                    break;
                }
            }
        },
        
        /**
         * @private
         */
        __onBubbleRendered: function() {
            if (this.__opener) {
                this.__openerEl = this.__opener instanceof croc.ui.Widget ? this.__opener.getElement() : this.__opener;
                croc.utils.domLinkElementToOpener(this.getWrapperElement(), this.__openerEl);
            }
            
            //hide/show processing
            this.on('changeShown', function(shown) {
                if (shown) {
                    this.__onShow();
                }
                else {
                    this.__zIndexWasSet = false;
                    this.__showDisposer.disposeAll();
                    this.fireEvent('close');
                }
            }, this);
            if (this.getShown()) {
                this.__onShow();
            }
            
            //closing
            this.getElement().on('keydown', function(e) {
                if (e.keyCode === 27/*ESCAPE*/) {
                    this.close();
                }
            }.bind(this));
            this.getElement().on('click', '.js-bubble-close', function() {
                this.close();
            }.bind(this));
            
            //autoclose
            this.getElement().hover(function() {
                this.stopCloseTimeout();
            }.bind(this), function() {
                this.startCloseTimeout();
            }.bind(this));
            
            //open on demand
            if (this._openOnRender && !this.getOpen()) {
                this.open.apply(this, this._openOnRender);
            }
        },
        
        /**
         * @private
         */
        __onShow: function() {
            var options = this._options;
            
            this.startCloseTimeout();
            
            if (options.closeOnHtmlClick) {
                this.__showDisposer.addCallback(croc.utils.domStableClick($(document), function(e) {
                    if (this._isClosingOnHtmlClickAllowed($(e.target))) {
                        this.close();
                    }
                }, this));
            }
            
            if (options.closeOnResize || options.dynamicPositioning) {
                var onResize = function() {
                    if (options.closeOnResize) {
                        this.close();
                    }
                    if (options.dynamicPositioning) {
                        this.reposition();
                    }
                }.bind(this);
                
                this.__showDisposer.addListener($(window), 'resize', function(e) {
                    if (e.target === window) {
                        onResize();
                    }
                }, this);
            }
            
            if (options.closeOnScroll || options.dynamicPositioning) {
                var onScroll = function() {
                    if (options.closeOnScroll) {
                        this.close();
                    }
                    if (options.dynamicPositioning) {
                        this.reposition();
                    }
                }.bind(this);
                
                this.__showDisposer.addCallback(croc.utils.domListenScrolling(this.getElement(), onScroll));
            }
            
            if (this.getKeepActualPosition()) {
                this.__applyKeepActualPosition(true);
            }
        },
        
        /**
         * @private
         */
        __repositionAutoSize: function(options, isCenter, leftOrRight, target) {
            if (options.autoSize) {
                var prefix = options.autoSizeKind ? options.autoSizeKind + '-' : '';
                var sizable = this._getSizeableElement();
                sizable.css(prefix + 'width',
                    isCenter || !leftOrRight ? target.width - options.autoSizeGap * 2 : '');
                sizable.css(prefix + 'height',
                    isCenter || leftOrRight ? target.height - options.autoSizeGap * 2 : '');
            }
        },
        
        /**
         * @param {boolean} [curTargetOnly=false]
         * @returns {{left: number, top: number, width: number, height: number}}
         * @private
         */
        __resolveTarget: function(curTargetOnly) {
            var target = this.getTarget();
            if (typeof target === 'function') {
                target = target(this);
            }
            
            if (target instanceof croc.ui.Widget) {
                target = target.getElement();
            }
            
            this.__currentTarget = target;
            
            if (curTargetOnly) {
                return null;
            }
            
            if (Array.isArray(target)) {
                if (typeof target[0] === 'number') {
                    target = [target, target];
                }
            }
            else {
                var box = [
                    [Number.MAX_VALUE, Number.MAX_VALUE],
                    [Number.MIN_VALUE, Number.MIN_VALUE]
                ];
                target.each(function(i, el) {
                    el = $(el);
                    
                    var offset = el.offset();
                    if (offset) {
                        this._adjustCoorsForScrolling(offset);
                    }
                    else {
                        offset = this.__getWindowOffset();
                    }
                    
                    var width = el.outerWidth();
                    var height = el.outerHeight();
                    box = [
                        [Math.min(offset.left, box[0][0]), Math.min(offset.top, box[0][1])],
                        [Math.max(offset.left + width, box[1][0]), Math.max(offset.top + height, box[1][1])]
                    ];
                }.bind(this));
                target = box;
            }
            
            return {
                left: target[0][0],
                top: target[0][1],
                width: target[1][0] - target[0][0],
                height: target[1][1] - target[0][1]
            };
        },
        
        /**
         * @private
         */
        __showAnimation: function(type) {
            this.__opening = true;
            
            var element = this.getWrapperElement();
            var curPos = !this.__currentPosition || this.__currentPosition === 'center' ? 'top' : this.__currentPosition;
            var animation = {
                opacity: 1
            };
            
            if (type === 'fly') {
                var axis = curPos === 'left' || curPos === 'right' ? 'left' : 'top';
                var old = parseInt(element.css(axis), 10);
                var shift = (curPos === 'left' || curPos === 'top' ? -1 : 1) * croc.ui.common.bubble.MBubble.__FLY_OFFSET;
                element.css(axis, old + shift);
                animation[axis] = old;
            }
            else if (type === 'slide') {
                animation.top = parseInt(element.css('top'), 10);
                element.css({top: -element.height(), opacity: 1});
            }
            
            element.stop(true);
            if (this._options.showAnimationDelay) {
                element.delay(this._options.showAnimationDelay);
            }
            element.animate(animation, this._options.animationDuration, function() {
                this.__opening = false;
            }.bind(this));
        }
    }
});
