/**
 * Bubble mixin with triggering mechanism
 * В качестве target можно указывать 'mouseTrigger' (должен быть обязательно указан trigger), в этом случае
 * тултип появится возле курсора мыши при открытии.
 */
croc.Mixin.define('croc.cmp.common.bubble.MBubbleTrigger', {
    extend: croc.cmp.common.bubble.MBubble,
    
    statics: {
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
        }
    },
    
    options: {
        /**
         * Если условие не выполнится, тултип не откроется
         * @type {function(jQuery, croc.ui.tooltip.Tooltip):boolean}
         */
        openCondition: {
            type: 'function'
        },
        
        /**
         * Зона, при взаимодействии с которой появляется тултип (по-умолчанию равен target)
         * @type {jQuery|croc.cmp.Widget}
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
        }
    },
    
    preConstruct: function() {
        //Disposer живёт после попытки открыть тултип до его открытия по прошествии времени openDelay
        this.__openDelayDisposer = new croc.util.Disposer();
        this.once('changeRendered', function() {
            if (this.__trigger) {
                this.listenProperty('shown', function(shown) {
                    if (shown) {
                        this.__openDelayDisposer.disposeAll();
                    }
                    else {
                        this._options.currentTrigger = null;
                    }
                }, this);
                
                this.__addTriggerListeners();
            }
        }, this);
    },
    
    destruct: function() {
        this.__openDelayDisposer.disposeAll();
    },
    
    members: {
        /**
         * @param {boolean} [elementOnly=false]
         * @returns {jQuery}
         */
        getCurrentTrigger: function(elementOnly) {
            var trigger = this._options.currentTrigger ||
                (this._options.triggerSelector || !this.__trigger ?
                this.getCurrentTarget() || this.getTarget() : this.__trigger);
            if (trigger && trigger instanceof croc.cmp.Widget) {
                trigger = trigger.getElement();
            }
            return !trigger || (elementOnly && !(trigger instanceof jQuery)) ? null : trigger;
        },
        
        getTrigger: function() {
            return this.__trigger;
        },
        
        /**
         * Показать bubble. Если тултип был открыт, то возвращает true.
         * @param {boolean} [onTrigger=false] курсор находится на триггере, после открытия следует остановить таймер
         * автозакрытия
         * @returns {boolean}
         */
        open: function(onTrigger) {
            if (this.getDisableOpening()) {
                return false;
            }
            
            var wasHidden = !this.getShown();
            
            var wasOpened = onTrigger ?
                this.__onTriggerOpen(this.getCurrentTrigger(true), null) :
                croc.cmp.common.bubble.MBubble.prototype.open.apply(this, arguments);
            
            if (!wasOpened) {
                this._openOnRender = _.toArray(arguments);
            }
            
            //если тултип был открыт не кликом, то некоторое время не разрешаем закрывать его кликом
            if (wasOpened && this.__openEvent !== 'click' && this._options.triggerOptions.closeOnClick) {
                this.__dontCloseOnClick = true;
                var callback = this.getShowDisposer().addCallback(function() {
                    this.__dontCloseOnClick = false;
                }, this);
                this.getOpenDisposer().setTimeout(function() {
                    this.__dontCloseOnClick = false;
                    callback.remove();
                }.bind(this), 300);
            }
            
            if (!this.__internalOpen && wasHidden && wasOpened && !onTrigger) {
                var curTrigger = this.getCurrentTrigger(true);
                if (curTrigger) {
                    this._options.currentTrigger = curTrigger;
                    this.__addTriggerOffListeners(curTrigger);
                }
            }
            this.__internalOpen = false;
            this.__openEvent = null;
            
            return wasOpened;
        },
        
        /**
         * @protected
         */
        _bubbleInitWidget: function() {
            var options = this._options;
            
            this.__trigger = options.trigger &&
            (options.trigger instanceof croc.cmp.Widget ? options.trigger.getElement() : options.trigger);
            
            if (this.getTarget() === 'mouseTrigger') {
                this.setTarget(null);
                this.__mouseTrigger = true;
            }
            
            if (!this.__trigger) {
                this.__trigger = this.getTargetElement();
            }
            
            if (!options.controlWidget && !this.getTarget() && this.__trigger) {
                options.controlWidget = croc.cmp.Widget.getClosestWidget(this.__trigger);
            }
            
            croc.cmp.common.bubble.MBubble.prototype._bubbleInitWidget.apply(this, arguments);
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
            
            if (this._options.triggerOptions.openOnMouseenter) {
                add('mouseleave');
            }
        },
        
        /**
         * Отслеживать события для открытия тултипа
         * @private
         */
        __addTriggerListeners: function() {
            var add = function(event) {
                var eventParam = this._options.triggerSelector ? [event, this._options.triggerSelector] : event;
                this._getDisposer().addListener(this.__trigger, eventParam, function(e) {
                    if (this.__closingElement !== e.currentTarget) {
                        if (this.__mouseTrigger) {
                            this.setTarget([e.pageX, e.pageY]);
                        }
                        this.__onTriggerStart($(e.currentTarget), event);
                    }
                }, this);
            }.bind(this);
            
            if (this._options.triggerOptions.openOnMouseenter) {
                add('mouseenter');
            }
            
            if (this._options.triggerOptions.openOnClick) {
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
                this.getOpenDisposer().addListener(el, event, function(e) {
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
            
            if (this._options.triggerOptions.closeOnMouseleave) {
                add('mouseleave');
            }
            
            if (this._options.triggerOptions.closeOnClick) {
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
            if (this.getDisableOpening()) {
                return;
            }
            
            if (!this._options.openDelay || (this._options.triggerOptions.openOnClickImmediately && event === 'click')) {
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
                }.bind(this), this._options.openDelay);
                
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
            if (this.getShown() && (!this._options.currentTrigger || el[0] !== this._options.currentTrigger[0])) {
                this.close(true);
            }
            
            if (!this.getOpen() && (!this._options.openCondition || this._options.openCondition(el, this))) {
                
                this._options.currentTrigger = el;
                
                //если у тултипа нет target, то назначаем его из текущего элемента-триггера
                if (!this.getTarget()) {
                    this.setTarget(el);
                    this.__targetSet = true;
                }
                
                this.getOpenDisposer().addCallback(function() {
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
                    this.getOpenDisposer().addListeners(el, {
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
        }
    }
});
