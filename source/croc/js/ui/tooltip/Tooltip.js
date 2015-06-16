/**
 * Тултип
 * В качестве target можно указывать 'mouseTrigger' (должен быть обязательно указан trigger), в этом случае при
 * тултип появится возле курсора мыши при открытии.
 */
croc.Class.define('croc.ui.tooltip.Tooltip', {
    extend: croc.ui.Container,
    implement: croc.ui.common.bubble.IBubble,
    include: croc.ui.common.bubble.MBubble,
    
    statics: {
        /**
         * шаблон списка внутри тултипа. view - inline, block
         * @type {string}
         */
        TEMPLATE_TOOLTIP_LIST: '<div class="b-tooltip-list view_{view} {cls}">{items}</div>',
        
        /**
         * шаблон элемента списка внутри тултипа
         * @type {string}
         */
        TEMPLATE_TOOLTIP_LIST_ITEM: '<div class="b-tooltip-item">{content}</div>',
        
        /**
         * @type {string}
         */
        TEMPLATE_FOOTER_ACTION: '' +
        '<div class="b-tooltip-foot">' +
        '   <div class="b-tooltip-foot-action js-tooltip-foot-action">{text}</div>' +
        '</div>',
        
        /**
         * Пресет triggerOptions для открытия/закрытия по клику
         * @type {Object}
         */
        TRIGGER_CLICK: {
            openOnMouseenter: false,
            openOnClick: true,
            closeOnClick: true
        },
        
        /**
         * Пресет triggerOptions для открытия/закрытия по клику
         * @type {Object}
         */
        TRIGGER_CLICK_OPEN: {
            openOnMouseenter: false,
            openOnClick: true
        },
        
        /**
         * Пресет triggerOptions для открытия/закрытия по клику
         * @type {Object}
         */
        TRIGGER_NONE: {
            openOnMouseenter: false
        },
        
        /**
         * @private
         * @static
         */
        __POSITION_TO_DIR: {
            top: 'btt',
            bottom: 'ttb',
            right: 'ltr',
            left: 'rtl'
        },
        
        /**
         * @param {Object} conf
         * @param {Function} [cls=croc.ui.tooltip.Tooltip]
         * @param {function(Object)} [confCallback]
         * @param [context]
         * @returns {$.Deferred}
         */
        lazyTooltip: function(conf, cls, confCallback, context) {
            if (!cls) {
                cls = croc.ui.tooltip.Tooltip;
            }
            
            var deferred = $.Deferred();
            
            var el = conf.target;
            var trigger = _.assign(_.clone(cls.config.options.triggerOptions.value), conf.triggerOptions);
            var event = _.compact([trigger.openOnMouseenter && 'mouseenter', trigger.openOnClick && 'click']).join(' ');
            
            var wasDelay = false;
            var timeout;
            
            var listener = function(e) {
                if (timeout) {
                    return;
                }
                
                if (conf.openDelay && !wasDelay && !(trigger.openOnClickImmediately && e && e.type === 'click')) {
                    timeout = setTimeout(function() {
                        wasDelay = true;
                        timeout = null;
                        listener();
                    }, conf.openDelay);
                    
                    el.on('mouseleave', function() {
                        clearTimeout(timeout);
                        timeout = null;
                    });
                    
                    return;
                }
                
                el.off(event, listener);
                if (conf.openDelay) {
                    el.off('mouseleave', delayOffListener);
                }
                if (timeout) {
                    clearTimeout(timeout);
                }
                
                if (confCallback) {
                    confCallback.call(context || window, conf);
                }
                var tooltip = new cls(conf);
                deferred.resolve(tooltip);
                tooltip.open(true);
            };
            el.on(event, listener);
            
            var delayOffListener = function() {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }
            };
            if (conf.openDelay) {
                el.on('mouseleave', delayOffListener);
            }
            
            deferred.open = function() {
                listener({type: 'program'});
            };
            
            return deferred;
        }
    },
    
    properties: {
        /**
         * Содержимое тултипа. Внутренний шаблон.
         * @type {string}
         */
        content: {
            type: 'string',
            value: '',
            apply: function(value) {
                if (this.getElement()) {
                    this.getBodyElement().html(value);
                }
            },
            option: true
        },
        
        /**
         * @type {string}
         * @private
         */
        dir: {
            cssClass: true,
            __getter: null,
            __setter: null
        },
        
        /**
         * Разрешено ли открывать тултип
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            value: false,
            apply: function(value) {
                if (!value) {
                    this.__openDelayDisposer.disposeAll();
                    this.close();
                }
            }
        },
        
        /**
         * Новый дизайн тултипов
         * @type {boolean}
         */
        newDesign: {
            cssClass: 'set_default',
            type: 'boolean',
            option: true,
            value: true
        },
        
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            inherit: true,
            value: 'top'
        },
        
        /**
         * Цветовая схема тултипа
         * @type {string}
         */
        scheme: {
            cssClass: true,
            check: ['white', 'red'],
            value: 'white',
            option: true
        },
        
        /**
         * Скин тултипа
         * @type {string}
         */
        skin: {
            cssClass: true,
            type: 'string',
            value: 'default',
            option: true
        }
    },
    
    options: {
        /**
         * Флаг, закрывать ли bubble через некоторый таймаут после открытия
         * @type {boolean}
         */
        autoClose: true,
        
        /**
         * Автоматическое позиционирование bubble исходя из положения на экране
         * @type {boolean}
         */
        autoPositioning: true,
        
        /**
         * Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * @type {Array|Object}
         */
        autoPositioningSequence: {
            value: {
                right: ['bottom', 'top', 'left'],
                bottom: ['right', 'top', 'left'],
                left: ['bottom', 'right', 'top'],
                top: ['right', 'bottom', 'left']
            }
        },
        
        /**
         * css-стили b-tooltip-body
         * @type {Object}
         */
        bodyStyle: {
            extend: true
        },
        
        /**
         * Флаг, закрывать ли bubble на клик по документу
         * @type {boolean}
         */
        closeOnHtmlClick: true,
        
        /**
         * Флаг, позиционировать ли bubble при ресайзе/скролле
         * @type {boolean}
         */
        dynamicPositioning: true,
        
        /**
         * Содержимое футера тултипа.
         * @type {string}
         */
        footer: {
            type: 'string',
            value: ''
        },
        
        /**
         * Анимация сокрытия
         * @see #showAnimation
         * @type {string}
         */
        hideAnimation: 'fade',
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<div class="b-tooltip{cls}">' +
        '   <div class="b-tooltip-tri"></div>' +
        '   <div class="b-tooltip-head"></div>' +
        '   <div class="b-tooltip-body">{items}</div>' +
        '   {footer}' +
        '</div>',
        
        /**
         * Если условие не выполнится, тултип не откроется
         * @type {function(jQuery, croc.ui.tooltip.Tooltip):boolean}
         */
        openCondition: {
            type: 'function'
        },
        
        /**
         * Время от возбуждения события до открытия тултипа
         * @type {number}
         */
        openDelay: {
            type: 'number'
        },
        
        /**
         * Расстояние от края bubble до соответствующего края target.
         * null - по-умолчанию (10 для старых тултипов, 8 для новых)
         * @type {number}
         */
        sourceDistance: null,
        
        /**
         * Зона, при взаимодействии с которой появляется тултип (по-умолчанию равен target)
         * @type {jQuery|croc.ui.Widget}
         */
        trigger: {},
        
        /**
         * Опции триггеринга (событий показа/сокрытия) тултипа
         * @type {Object}
         */
        triggerOptions: {
            type: 'object',
            extend: true,
            value: {
                openOnMouseenter: true,
                closeOnMouseleave: false,
                openOnClick: false,
                openOnClickImmediately: true,
                closeOnClick: false
            }
        },
        
        /**
         * Селектор внутри триггера, на который делегируются события триггеринга
         * @type {string}
         */
        triggerSelector: {
            type: 'string'
        },
        
        /**
         * Расстояние от края bubble до центра target при выравнивании относительно центра
         * @type {number}
         */
        _alignGap: 20,
        
        /**
         * Минимально возможное пересечение target и bubble при смещении во время автопозиционирования
         * @type {number}
         */
        _minIntersection: 15,
        
        /**
         * Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * @type {Array.<number>}
         */
        screenGap: [5, 5, 5, 5]
    },
    
    construct: function(options) {
        //Disposer живёт после попытки открыть тултип до его открытия по прошествии времени openDelay
        this.__openDelayDisposer = new croc.util.Disposer();
        
        this.on('beforePosition', function() {
            this.__setDir(croc.ui.tooltip.Tooltip.__POSITION_TO_DIR[this.getCurrentPosition()] || null);
        }, this);
        
        croc.ui.tooltip.Tooltip.superclass.construct.apply(this, arguments);
    },
    
    destruct: function() {
        this.__openDelayDisposer.disposeAll();
    },
    
    members: {
        /**
         * Элемент, содержащий контент тултипа
         * @returns {jQuery}
         */
        getBodyElement: function() {
            return this.__bodyElement || (this.__bodyElement = this.getElement().find('.b-tooltip-body'));
        },
        
        /**
         * @param {boolean} [elementOnly=false]
         * @returns {jQuery}
         */
        getCurrentTrigger: function(elementOnly) {
            var trigger = this.__currentTrigger ||
                (this.__triggerSelector || !this.__trigger ?
                this.getCurrentTarget() || this.getTarget() : this.__trigger);
            if (trigger && trigger instanceof croc.ui.Widget) {
                trigger = trigger.getElement();
            }
            return !trigger || (elementOnly && !(trigger instanceof jQuery)) ? null : trigger;
        },
        
        /**
         * Показать bubble. Если тултип был открыт, то возвращает true.
         * @param {boolean} [onTrigger=false] курсор находится на триггере, после открытия следует остановить таймер
         * автозакрытия
         * @returns {boolean}
         */
        open: function(onTrigger) {
            if (this.getDisabled()) {
                return;
            }
            
            var wasHidden = !this.getShown();
            
            var wasOpened = onTrigger ?
                this.__onTriggerOpen(this.getCurrentTrigger(true), null) :
                croc.ui.common.bubble.MBubble.prototype.open.apply(this, arguments);
            
            if (!wasOpened) {
                this._openOnRender = _.toArray(arguments);
            }
            
            //если тултип был открыт не кликом, то некоторое время не разрешаем закрывать его кликом
            if (wasOpened && this.__openEvent !== 'click' && this.__triggerOptions.closeOnClick) {
                this.__dontCloseOnClick = true;
                var callback = this._getShowDisposer().addCallback(function() {
                    this.__dontCloseOnClick = false;
                }, this);
                this._getOpenDisposer().setTimeout(function() {
                    this.__dontCloseOnClick = false;
                    callback.remove();
                }.bind(this), 300);
            }
            
            if (!this.__internalOpen && wasHidden && wasOpened && !onTrigger) {
                var curTrigger = this.getCurrentTrigger(true);
                if (curTrigger) {
                    this.__currentTrigger = curTrigger;
                    this.__addTriggerOffListeners(curTrigger);
                }
            }
            this.__internalOpen = false;
            this.__openEvent = null;
            
            return wasOpened;
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.tooltip.Tooltip.superclass._getAddRenderData.apply(this, arguments), {
                items: this.getContent() || null,
                footer: options.footer || ''
            });
        },
        
        /**
         * Элемент отвечающий за размеры bubble
         * @returns {jQuery}
         * @protected
         */
        _getSizeableElement: function() {
            return this.getBodyElement();
        },
        
        /**
         * Возвращает коллекцию элементов, к которым в данный момент прикреплён bubble
         * @returns {jQuery}
         * @protected
         */
        _getHostElements: function() {
            var curTarget = this.getCurrentTarget();
            return curTarget && curTarget instanceof jQuery ? curTarget : this.__trigger || null;
        },
        
        /**
         * Возвращает элемент точки крепления. Например, стрелка тултипа.
         * @returns {jQuery}
         * @protected
         */
        _getJointEl: function() {
            return this.__jointEl || (this.__jointEl = this.getElement().find('.b-tooltip-tri'));
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.tooltip.Tooltip.superclass._initWidget.apply(this, arguments);
            
            this.__setUpTriggering();
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         * @private
         */
        _isClosingOnHtmlClickAllowed: function(targetEl) {
            return croc.ui.common.bubble.MBubble.prototype._isClosingOnHtmlClickAllowed.apply(this, arguments) &&
                (!this.__currentTrigger || !targetEl.closest(this.__currentTrigger).length);
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__openCondition = options.openCondition;
            this.__openDelay = options.openDelay;
            this.__bodyStyle = options.bodyStyle;
            this.__trigger = options.trigger &&
            (options.trigger instanceof croc.ui.Widget ? options.trigger.getElement() : options.trigger);
            this.__triggerOptions = options.triggerOptions;
            this.__triggerSelector = options.triggerSelector;
            
            if (this.getTarget() === 'mouseTrigger') {
                this.setTarget(null);
                this.__mouseTrigger = true;
            }
            
            if (!this.__trigger) {
                var target = this.getTarget();
                if (target instanceof croc.ui.Widget) {
                    this.__trigger = target.getElement();
                }
                else if (target instanceof jQuery) {
                    this.__trigger = target;
                }
            }
            
            if (!options.controlWidget && !this.getTarget() && this.__trigger) {
                options.controlWidget = croc.ui.Widget.getClosestWidget(this.__trigger);
            }
            
            if (options.newDesign && this.getSkin() === 'default') {
                this.setSkin(null);
            }
            if (options.sourceDistance === null) {
                options.sourceDistance = options.newDesign ? 8 : 10;
            }
            
            croc.ui.common.bubble.MBubble.prototype._onPropertiesInitialized.apply(this, arguments);
            croc.ui.tooltip.Tooltip.superclass._onPropertiesInitialized.apply(this, arguments);
        },
        
        /**
         * Назначить элемент виджету
         * @param {jQuery} el
         * @protected
         */
        _setElement: function(el) {
            croc.ui.tooltip.Tooltip.superclass._setElement.apply(this, arguments);
            if (this.__bodyStyle) {
                this.getBodyElement().css(this.__bodyStyle);
            }
        },
        
        /**
         * Во время ожидания открытия тултипа отслеживаем события, которые могут отменить открытие
         * @param el
         * @private
         */
        __addDelayOffListeners: function(el) {
            var add = function(event) {
                this.__openDelayDisposer.addListener(el, event, function() {
                    this.__openDelayDisposer.disposeAll();
                }, this);
            }.bind(this);
            
            if (this.__triggerOptions.openOnMouseenter) {
                add('mouseleave');
            }
        },
        
        /**
         * Отслеживать события для открытия тултипа
         * @private
         */
        __addTriggerListeners: function() {
            var add = function(event) {
                var eventParam = this.__triggerSelector ? [event, this.__triggerSelector] : event;
                this._getDisposer().addListener(this.__trigger, eventParam, function(e) {
                    if (this.__closingElement !== e.currentTarget) {
                        if (this.__mouseTrigger) {
                            this.setTarget([e.pageX, e.pageY]);
                        }
                        this.__onTriggerStart($(e.currentTarget), event);
                    }
                }, this);
            }.bind(this);
            
            if (this.__triggerOptions.openOnMouseenter) {
                add('mouseenter');
            }
            
            if (this.__triggerOptions.openOnClick) {
                add('click');
            }
        },
        
        /**
         * Отслеживать события, по которым тултип должен закрываться
         * @param el
         * @private
         */
        __addTriggerOffListeners: function(el) {
            var add = function(event) {
                this._getOpenDisposer().addListener(el, event, function(e) {
                    if (this.__dontCloseOnClick && event === 'click') {
                        return;
                    }
                    
                    this.close();
                    this.__closingElement = el[0];
                    this._getDisposer().defer(function() {
                        this.__closingElement = null;
                    }, this);
                }, this);
            }.bind(this);
            
            if (this.__triggerOptions.closeOnMouseleave) {
                add('mouseleave');
            }
            
            if (this.__triggerOptions.closeOnClick) {
                add('click');
            }
        },
        
        /**
         * Метод вызывается при возбуждении события для открытия тултипа
         * @param el
         * @param event
         * @private
         */
        __onTriggerStart: function(el, event) {
            if (this.getDisabled()) {
                return;
            }
            
            if (!this.__openDelay || (this.__triggerOptions.openOnClickImmediately && event === 'click')) {
                this.__onTriggerOpen(el, event);
            }
            //если необходимо подождать перед открытием тултипа
            else {
                
                if (this.__currentDelayEl && this.__currentDelayEl[0] === el[0]) {
                    return;
                }
                
                this.__openDelayDisposer.disposeAll();
                
                this.__currentDelayEl = el;
                this.__openDelayDisposer.addCallback(function() {
                    this.__currentDelayEl = null;
                }, this);
                
                //открываем тултип по прошествии openDelay
                this.__openDelayDisposer.setTimeout(function() {
                    this.__onTriggerOpen(el, event);
                }.bind(this), this.__openDelay);
                
                this.__addDelayOffListeners(el);
            }
        },
        
        /**
         * Открыть тултип после успешного триггеринга
         * @param el
         * @param event
         * @private
         */
        __onTriggerOpen: function(el, event) {
            this.stopCloseTimeout();
            
            //если был произведён триггеринг на другом элементе, то закрываем тултип перед открытием на новом
            if (this.getShown() && (!this.__currentTrigger || el[0] !== this.__currentTrigger[0])) {
                this.close(true);
            }
            
            if (!this.getOpen() && (!this.__openCondition || this.__openCondition(el, this))) {
                
                this.__currentTrigger = el;
                
                //если у тултипа нет target, то назначаем его из текущего элемента-триггера
                if (!this.getTarget()) {
                    this.setTarget(el);
                    this.__targetSet = true;
                }
                
                this._getOpenDisposer().addCallback(function() {
                    if (this.__targetSet) {
                        this.setTarget(null);
                        this.__targetSet = false;
                    }
                }, this);
                
                //открываем и сразу останавливаем таймер закрытия тултипа
                this.__internalOpen = true;
                this.__openEvent = event;
                if (this.open()) {
                    this.stopCloseTimeout();
                    
                    //запускаем таймер только если мышь покинула зону триггера
                    this._getOpenDisposer().addListeners(el, {
                        mouseleave: function() {
                            this.startCloseTimeout();
                        }.bind(this),
                        mouseenter: function() {
                            this.stopCloseTimeout();
                        }.bind(this)
                    });
                    
                    this.__addTriggerOffListeners(el);
                    return true;
                }
            }
            return false;
        },
        
        /**
         * Настроить триггеринг тултипа (открытие/закрытие по определённым событиям)
         * @private
         */
        __setUpTriggering: function() {
            if (this.__trigger) {
                this.listenProperty('shown', function(shown) {
                    if (shown) {
                        this.__openDelayDisposer.disposeAll();
                    }
                    else {
                        this.__currentTrigger = null;
                    }
                }, this);
                
                this.__addTriggerListeners();
            }
        }
    }
});
