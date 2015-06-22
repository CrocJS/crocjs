/**
 * Tooltip
 */
croc.Class.define('croc.cmp.tooltip.Tooltip', {
    extend: croc.cmp.Widget,
    implement: croc.cmp.common.bubble.IBubble,
    include: croc.cmp.common.bubble.MBubbleTrigger,
    
    statics: {
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
         * @param {Function} [cls=croc.cmp.tooltip.Tooltip]
         * @param {function(Object)} [confCallback]
         * @param [context]
         * @returns {$.Deferred}
         */
        lazy: function(conf, cls, confCallback, context) {
            if (!cls) {
                cls = croc.cmp.tooltip.Tooltip;
            }
            
            var deferred = $.Deferred();
            
            var el = conf.target;
            var trigger = _.assign({}, cls.config.options.triggerOptions.value, conf.triggerOptions);
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
                var tooltip = new cls(conf).render();
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
         * css-стили для b-tooltip-body
         * @type {string}
         */
        bodyStyle: {
            model: true
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
            value: 'white',
            model: true
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
        footer: {},
        
        /**
         * @type {string}
         */
        head: {},
        
        /**
         * Анимация сокрытия
         * @see #showAnimation
         * @type {string}
         */
        hideAnimation: 'fade',
        
        /**
         * Если условие не выполнится, тултип не откроется
         * @type {function(jQuery, croc.cmp.tooltip.Tooltip):boolean}
         */
        openCondition: {
            type: 'function'
        },
        
        /**
         * Время от возбуждения события до открытия тултипа
         * @type {number}
         */
        openDelay: {},
        
        /**
         * Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * @type {Array.<number>}
         */
        screenGap: [5, 5, 5, 5],
        
        /**
         * Расстояние от края bubble до соответствующего края target.
         * @type {number}
         */
        sourceDistance: 8,
        
        /**
         * Расстояние от края bubble до центра target при выравнивании относительно центра
         * @type {number}
         */
        _alignGap: 20,
        
        /**
         * Минимально возможное пересечение target и bubble при смещении во время автопозиционирования
         * @type {number}
         */
        _minIntersection: 15
    },
    
    construct: function(options) {
        this.on('beforePosition', function() {
            this._model.set('dir', croc.cmp.tooltip.Tooltip.__POSITION_TO_DIR[this.getCurrentPosition()]);
        }, this);
        croc.cmp.tooltip.Tooltip.superclass.construct.apply(this, arguments);
    },
    
    members: {
        setContent: function(content) {
            this._model.set('newContent', content);
        },
        
        /**
         * Allow to get parent DOM-element as target if it's not passed
         * @returns {boolean}
         */
        _parentElementAsTarget: function() {
            return !this._options.trigger;
        }
    }
});
