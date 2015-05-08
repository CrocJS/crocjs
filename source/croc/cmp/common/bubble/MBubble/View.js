/**
 * Миксин добавляет свойство всплывающего элемента виджету. Изменение любых свойств позиционирования не приводит к
 * эффекту до вызова метода reposition.
 * @marker js-bubble-close закрыть bubble
 */
croc.Mixin.define('croc.cmp.common.bubble.MBubble.View', {
    statics: {
        /**
         * @private
         * @static
         */
        __ANIMATION_DURATION: 200,
        
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
    
    construct: function() {
        this.__animationDuration = croc.cmp.common.bubble.MBubble.View.__ANIMATION_DURATION;
        
        this._model.on('change', 'onClose', function(params) {
            this.onClose(params.quick);
        }.bind(this));
        this._model.on('change', 'onBeforeOpen', function() {
            this.__resolveTarget(true);
        }.bind(this));
        this._model.on('change', 'onOpen', this.onOpen.bind(this));
        this._model.on('change', 'onReposition', this.onReposition.bind(this));
        
        this._widget.getOpenDisposer().addCallback(function() {
            this._model.set('currentPosition', null);
            this._model.set('currentTarget', null);
        }, this);
        
        this._widget.getShowDisposer().addCallback(function() {
            this._widget.fireEvent('close');
        }, this);
        
        this._widget.once('changeRendered', function() {
            if (!this._widget.getTarget()) {
                this._widget.setTarget($(this._widget.getDetachParent()));
            }
            this._widget.setDetachParent(document.body);
            
            this._widget.on('changeShown', function(shown) {
                if (shown) {
                    this.__onShow();
                }
            }, this);
            if (this._widget.getShown()) {
                this.__onShow();
            }
        }, this);
    },
    
    members: {
        /**
         * Возвращает коллекцию элементов, к которым в данный момент прикреплён bubble
         * @returns {jQuery}
         */
        getHostElements: function() {
            return this._widget.getCurrentTarget(true);
        },
        
        /**
         * Возвращает элемент точки крепления. Например, стрелка тултипа.
         * @returns {jQuery}
         */
        getJointEl: function() {
            return null;
        },
        
        /**
         * Элемент отвечающий за размеры bubble
         * @returns {jQuery}
         */
        getSizeableElement: function() {
            return this._widget.getElement();
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         */
        isClosingOnHtmlClickAllowed: function(targetEl) {
            var el = this._widget.getElement();
            return !croc.utils.domIsElementOpenerOf(el, targetEl) && !targetEl.closest(el).length;
        },
        
        onClose: function(quick) {
            var hideAnimation = !quick && this._model.data.hideAnimation;
            var element = this._widget.getWrapperElement();
            
            this._model.set('opening', false);
            this._model.set('closing', false);
            
            if (hideAnimation) {
                this._model.set('closing', true);
                switch (hideAnimation) {
                    case 'fade':
                        element.stop(true).animate({
                            opacity: 0
                        }, this.__animationDuration, function() {
                            this._widget.setShown(false);
                            this._model.set('closing', false);
                        }.bind(this));
                        break;
                    
                    case 'fly':
                        this.__hideFlyAnimation();
                        break;
                }
            }
            else {
                element.stop(true);
                this._widget.setShown(false);
            }
        },
        
        onOpen: function() {
            var showAnimation = this._model.data.showAnimation;
            var element = this._widget.getWrapperElement();
            
            if (showAnimation) {
                element.css('opacity', 0);
            }
            
            element.css({visibility: 'hidden', left: 0, top: 0});
            
            this.__repositionedOnAppear = false;
            this._widget.setShown(true);
            if (!this.__repositionedOnAppear) {
                this._widget.reposition();
            }
            
            this._model.set('closing', false);
            this._widget.fireEvent('open');
            
            //animate
            if (showAnimation) {
                this.__showAnimation(showAnimation);
            }
            else {
                element.css('opacity', 1);
                element.stop(true);
            }
            
            this._widget.getOpenDisposer().defer(function() {
                element.css('visibility', '');
            });
        },
        
        onReposition: function() {
            var curPos = this._widget.getPosition();
            this._model.set('currentPosition', curPos);
            var options = this._model.data;
            
            this._widget.getScreenGap();
            
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
            var element = this._widget.getElement();
            var resultOffset = {};
            var jointElCss;
            
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
                    curPos = bestPosition;
                }
                else if (i > 0) {
                    //берём следующую позицию для рассмотрения
                    curPos = sequence[sequence.indexOf(curPos) + 1] || sequence[0];
                }
                else if (options.autoPositioning && sequence.indexOf(curPos) === -1) {
                    curPos = sequence[0];
                }
                this._model.set('currentPosition', curPos);
                
                jointElCss = {left: '', top: ''};
                
                this._widget.fireEvent('beforePosition');
                
                //todo optimize здесь можно оптимизировать
                var target = this.__resolveTarget();
                
                //переменная содержит потенциальное значение для bestPositionValue. Если переменная отлична от null
                //значит для данной позиции bubble не вмещается на экран полностью.
                var continueWith = 1;
                var isCenter = curPos === 'center';
                var leftOrRight = curPos === 'left' || curPos === 'right';
                
                //расстояние от края target до края bubble
                var distance = this._widget.getOffset() || 0;
                //смещение target относительно bubble
                var secondDistance = 0;
                if (Array.isArray(distance)) {
                    secondDistance = distance[1];
                    distance = distance[0];
                }
                
                //вычисляем размер bubble
                this.__repositionAutoSize(isCenter, leftOrRight, target);
                var elHeight = element.outerHeight();
                var elWidth = element.outerWidth();
                
                //позиционируем bubble по главной оси
                switch (curPos) {
                    case 'top':
                        resultOffset.top = target.top - distance - options.sourceDistance - elHeight;
                        break;
                    
                    case 'bottom':
                        resultOffset.top = target.top + target.height + distance + options.sourceDistance;
                        break;
                    
                    case 'left':
                        resultOffset.left = target.left - distance - options.sourceDistance - elWidth;
                        break;
                    
                    case 'right':
                        resultOffset.left = target.left + target.width + distance + options.sourceDistance;
                        break;
                    
                    case 'center':
                        resultOffset.left = target.left + target.width / 2 - elWidth / 2 + distance;
                        resultOffset.top = target.top + target.height / 2 - elHeight / 2 + secondDistance;
                        if (options.autoShift) {
                            var winOffset = this.__getWindowOffset();
                            resultOffset.left = Math.max(winOffset.left + options.screenGap[3], resultOffset.left);
                            resultOffset.top = Math.max(winOffset.top + options.screenGap[0], resultOffset.top);
                        }
                        
                        //todo здесь потенциально может быть ошибка, если !options.autoShift
                        var elParent = element.parent();
                        if (elParent[0] !== document.body) {
                            resultOffset.left =
                                Math.max(resultOffset.left - croc.utils.domNumericCss(elParent, 'paddingLeft'), 0);
                            resultOffset.top =
                                Math.max(resultOffset.top - croc.utils.domNumericCss(elParent, 'paddingTop'), 0);
                        }
                        
                        break;
                }
                
                if (curPos === 'center') {
                    break;
                }
                
                //позиционируем bubble по второй оси
                if (!leftOrRight) {
                    resultOffset.left = this._widget.getHAlign() === 'left' ? target.left :
                        this._widget.getHAlign() === 'right' ? target.left + target.width - elWidth :
                        target.left + target.width / 2 - elWidth / 2;
                    resultOffset.left += secondDistance;
                }
                else {
                    resultOffset.top = this._widget.getVAlign() === 'top' ? target.top :
                        this._widget.getVAlign() === 'bottom' ? target.top + target.height - elHeight :
                        target.top + target.height / 2 - elHeight / 2;
                    resultOffset.top += secondDistance;
                }
                
                //позиционируем стрелку
                jointElCss = {
                    left: leftOrRight ? '' :
                        this._widget.getHAlign() === 'right' ?
                            Math.min(Math.max(elWidth - target.width / 2, minIntersection),
                                elWidth - minIntersection) :
                            this._widget.getHAlign() === 'left' ?
                                Math.max(Math.min(target.width / 2, elWidth - minIntersection), minIntersection) :
                            elWidth / 2,
                    top: !leftOrRight ? '' :
                        this._widget.getVAlign() === 'bottom' ?
                            Math.min(Math.max(elHeight - target.height / 2, minIntersection),
                                elHeight - minIntersection) :
                            this._widget.getVAlign() === 'top' ?
                                Math.max(Math.min(target.height / 2, elHeight - minIntersection), minIntersection) :
                            elHeight / 2
                };
                
                var shift = this.__getAlignShift(elWidth, elHeight);
                
                //проверяем вмещается ли bubble на экран полностью.
                //Если он не вмещается по главной оси, то мы рассмотрим следующую позицию позже.
                //Если он не вмещается по второй оси, то назначаем смещение (shift) достаточное для того, чтобы вместить его
                //либо если это невозможно, то рассмотрим следующую позицию позже
                var winWidth = $(window).width() - options.screenGap[1];
                var winHeight = $(window).height() - options.screenGap[2];
                var winOffsetLeft = resultOffset.left + (leftOrRight ? 0 : shift) - $(window).scrollLeft();
                var winOffsetTop = resultOffset.top + (leftOrRight ? shift : 0) - $(window).scrollTop();
                
                if (winOffsetLeft < options.screenGap[3]) {
                    if (!leftOrRight && options.autoShift) {
                        shift += options.screenGap[3] - winOffsetLeft;
                    }
                    else if ((!leftOrRight || curPos === 'left') && !lastPos) {
                        continueWith *= (elWidth - options.screenGap[3] + winOffsetLeft) / elWidth;
                    }
                }
                else if (winOffsetLeft + elWidth > winWidth) {
                    if (!leftOrRight && options.autoShift) {
                        shift += winWidth - (winOffsetLeft + elWidth);
                    }
                    else if ((!leftOrRight || curPos === 'right') && !lastPos) {
                        continueWith *= (winWidth - winOffsetLeft) / elWidth;
                    }
                }
                
                if (winOffsetTop < options.screenGap[0]) {
                    if (leftOrRight && options.autoShift) {
                        shift += options.screenGap[0] - winOffsetTop;
                    }
                    else if ((leftOrRight || curPos === 'top') && !lastPos) {
                        continueWith *= (elHeight - options.screenGap[0] + winOffsetTop) / elHeight;
                    }
                }
                else if (winOffsetTop + elHeight > winHeight) {
                    if (leftOrRight && options.autoShift) {
                        shift += winHeight - (winOffsetTop + elHeight);
                    }
                    else if ((leftOrRight || curPos === 'bottom') && !lastPos) {
                        continueWith *= (winHeight - winOffsetTop) / elHeight;
                    }
                }
                //
                
                //Если из-за смещения (shift) target и bubble перестают пересекаться по второй оси, то рассматриваем
                //следующую позицию. Иначе - задаём css-стили для точки крепления (если она есть).
                if (shift) {
                    if (!leftOrRight) {
                        resultOffset.left += shift;
                        
                        if (resultOffset.left + minIntersection > target.left + target.width ||
                            resultOffset.left + elWidth - minIntersection < target.left) {
                            if (lastPos) {
                                resultOffset.left = Math.max(
                                    Math.min(resultOffset.left, target.left + target.width - minIntersection),
                                    target.left + minIntersection - elWidth
                                );
                            }
                            else {
                                continue;
                            }
                        }
                        
                        jointElCss = {
                            left: Math.max(
                                minIntersection,
                                Math.min(elWidth - minIntersection, jointElCss.left - shift)
                            ),
                            top: ''
                        };
                    }
                    else {
                        resultOffset.top += shift;
                        
                        if (resultOffset.top + minIntersection > target.top + target.height ||
                            resultOffset.top + elHeight - minIntersection < target.top) {
                            if (lastPos) {
                                resultOffset.top = Math.max(
                                    Math.min(resultOffset.top, target.top + target.height - minIntersection),
                                    target.top + minIntersection - elHeight
                                );
                            }
                            else {
                                continue;
                            }
                        }
                        
                        jointElCss = {
                            left: '',
                            top: Math.max(
                                minIntersection,
                                Math.min(elHeight - minIntersection, jointElCss.top - shift)
                            )
                        };
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
            
            this.setZIndex();
            
            if (options._skipElementLeft) {
                delete resultOffset.left;
            }
            if (options._skipElementTop) {
                delete resultOffset.top;
            }
            
            var prevented = false;
            this._widget.fireEvent('beforePositionApply', resultOffset, jointElCss, function() { prevented = true; });
            if (prevented) {
                return;
            }
            
            element.css(resultOffset);
            var jointEl = this.getJointEl();
            if (jointEl) {
                jointEl.css(jointElCss);
            }
            
            if (!this._model.data.opener) {
                var hostElements = this.getHostElements();
                if (hostElements) {
                    croc.utils.domLinkElementToOpener(this._widget.getElement(), this.getHostElements());
                }
            }
            
            //this.onResize('reposition');
        },
        
        /**
         * Назначить элементу z-index
         * @protected
         */
        setZIndex: function() {
            var hostElements = this.getHostElements();
            
            //Берём ближайший к таргету родительский bubble (MBubble или b-tooltip или b-popup)
            var targetBubble = hostElements && hostElements.closest(croc.cmp.common.bubble.MBubble.View.__BUBBLE_SELECTOR);
            
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
            var elZIndex = _.parseInt(this._widget.getWrapperElement().css('zIndex'));
            if (!elZIndex || isNaN(elZIndex)) {
                elZIndex = 0;
            }
            
            //Если z-index не нужно менять, то завершаем метод
            if (this.__zIndexWasSet && hostElements === this.__lastZIndexTarget && elZIndex > curTargetZIndex) {
                return;
            }
            
            if (this._model.data._upperZIndexLayer) {
                this._model.set('zIndexLayer', 'popup');
            }
            else if (hostElements && hostElements instanceof jQuery) {
                //если target не лежит внутри какого-либо bubble, то кладём текущий bubble на нижний слой
                if (!targetBubble.length) {
                    this._model.set('zIndexLayer', 'page');
                }
                else {
                    //иначе пытаемся получить виджет targetBubble. Если он также реализует IBubble, узнаём на каком слое
                    //он лежит (getZIndexLayer) и если он лежит на нижнем слое, то кладём текущий bubble также на нижний слой.
                    //Если нет или если он не реализует IBubble, то кладём на верхний слой
                    var bubbleWidget = croc.cmp.Widget.getByElement(targetBubble);
                    this._model.set('zIndexLayer', (
                    bubbleWidget && croc.Interface.check(bubbleWidget, 'croc.cmp.common.bubble.IBubble') &&
                    bubbleWidget.getZIndexLayer()
                    ) || 'popup');
                }
            }
            else {
                //если target отсутствует, то кладём bubble на слой page
                this._model.set('zIndexLayer', 'page');
            }
            
            this.__lastZIndexTarget = hostElements;
            this.__zIndexWasSet = true;
            
            //назначаем новый z-index текущему bubble, удостоверяемся, что он больше чем z-index у target
            this._widget.getWrapperElement().css('zIndex',
                Math.max(croc.utils.getZIndex(this._model.get('zIndexLayer')), curTargetZIndex + 1));
        },
        
        /**
         * @param value
         * @private
         */
        __applyKeepActualPosition: function(value) {
            if (value) {
                if (this.getShown()) {
                    this.__keepActualPositionInterval =
                        this._widget.getShowDisposer().setInterval(function() {
                            if (!this._model.get('opening') && !this._model.get('closing')) {
                                this._widget.reposition();
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
         * @param elWidth
         * @param elHeight
         * @returns {number}
         * @private
         */
        __getAlignShift: function(elWidth, elHeight) {
            var curPos = this._model.get('currentPosition');
            if (curPos === 'center') {
                return 0;
            }
            
            var options = this._model.data;
            var leftOrRight = curPos === 'left' || curPos === 'right';
            var align = leftOrRight ? this._widget.getVAlign() : this._widget.getHAlign();
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
            return this._widget.getElement().closest('.b-overlay').length ?
            {left: 0, top: 0} : {left: win.scrollLeft(), top: win.scrollTop()};
        },
        
        /**
         * @private
         */
        __hideFlyAnimation: function() {
            var element = this._widget.getWrapperElement();
            var curPos = this._model.get('currentPosition');
            if (!curPos || curPos === 'center') {
                curPos = 'top';
            }
            
            var animation = {
                opacity: 0
            };
            
            var axis = curPos === 'left' || curPos === 'right' ? 'left' : 'top';
            var shift = (curPos === 'left' || curPos === 'top' ? -1 : 1) * croc.cmp.common.bubble.MBubble.View.__FLY_OFFSET;
            animation[axis] = parseInt(element.css(axis), 10) + shift;
            
            element.stop(true).animate(animation, this.__animationDuration, function() {
                this._widget.setShown(false);
                this._model.set('closing', false);
            }.bind(this));
        },
        
        /**
         * @private
         */
        __onBubbleRendered: function() {
            var opener = this._model.data.opener;
            var el = this._widget.getElement();
            if (opener) {
                this.__openerEl = croc.cmp.Widget.resolveElement(opener);
                croc.utils.domLinkElementToOpener(el, this.__openerEl);
            }
            
            //closing
            el.on('keydown', function(e) {
                if (e.keyCode === 27/*ESCAPE*/) {
                    this._widget.close();
                }
            }.bind(this));
            el.on('click', '.js-bubble-close', function() {
                this._widget.close();
            }.bind(this));
            
            //autoclose
            el.hover(function() {
                this._widget.stopCloseTimeout();
            }.bind(this), function() {
                this._widget.startCloseTimeout();
            }.bind(this));
        },
        
        /**
         * @private
         */
        __onShow: function() {
            var options = this._model.data;
            
            this._widget.startCloseTimeout();
            
            if (options.closeOnHtmlClick) {
                this._widget.getShowDisposer().addCallback(croc.utils.domStableClick($(document), function(e) {
                    if (this.isClosingOnHtmlClickAllowed($(e.target))) {
                        this._widget.close();
                    }
                }, this));
                if (Stm.env.device && Stm.env.device !== 'desktop') {
                    this._widget.getShowDisposer().addListener($(document), 'touchstart', function(e) {
                        if (this.isClosingOnHtmlClickAllowed($(e.target))) {
                            this._widget.close();
                        }
                    }, this);
                }
            }
            
            if (options.closeOnResize || options.dynamicPositioning) {
                var onResize = function() {
                    if (options.closeOnResize) {
                        this._widget.close();
                    }
                    if (options.dynamicPositioning) {
                        this._widget.reposition();
                    }
                }.bind(this);
                
                this._widget.getShowDisposer().addListener($(window), 'resize', function(e) {
                    if (e.target === window) {
                        onResize();
                    }
                }, this);
            }
            
            if (options.closeOnScroll || options.dynamicPositioning) {
                var onScroll = function() {
                    if (options.closeOnScroll) {
                        this._widget.close();
                    }
                    if (options.dynamicPositioning) {
                        this._widget.reposition();
                    }
                }.bind(this);
                
                this._widget.getShowDisposer()
                    .addCallback(croc.utils.domListenScrolling(this._widget.getElement(), onScroll));
            }
            
            this._widget.listenProperty('keepActualPosition', this.__applyKeepActualPosition, this);
        },
        
        /**
         * @private
         */
        __repositionAutoSize: function(isCenter, leftOrRight, target) {
            if (this._model.data.autoSize) {
                var prefix = this._model.data.autoSizeKind ? this._model.data.autoSizeKind + '-' : '';
                var sizable = this.getSizeableElement();
                sizable.css(prefix + 'width',
                    isCenter || !leftOrRight ? target.width - this._model.data.autoSizeGap * 2 : '');
                sizable.css(prefix + 'height',
                    isCenter || leftOrRight ? target.height - this._model.data.autoSizeGap * 2 : '');
            }
        },
        
        /**
         * @param {boolean} [curTargetOnly=false]
         * @returns {{left: number, top: number, width: number, height: number}}
         * @private
         */
        __resolveTarget: function(curTargetOnly) {
            var target = this._widget.getTarget();
            if (typeof target === 'function') {
                target = target(this);
            }
            
            if (target instanceof croc.cmp.Widget) {
                target = target.getElement();
            }
            
            this._model.set('currentTarget', target);
            
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
                    
                    var offset = el.offset() || this.__getWindowOffset();
                    
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
            
            var element = this._widget.getWrapperElement();
            var curPos = this._model.get('currentPosition');
            if (!curPos || curPos === 'center') {
                curPos = 'top';
            }
            var animation = {
                opacity: 1
            };
            
            if (type === 'fly') {
                var axis = curPos === 'left' || curPos === 'right' ? 'left' : 'top';
                var shift = (curPos === 'left' || curPos === 'top' ? -1 : 1) * croc.cmp.common.bubble.MBubble.View.__FLY_OFFSET;
                var old = parseInt(element.css(axis), 10);
                element.css(axis, old + shift);
                animation[axis] = old;
            }
            
            element.stop(true).animate(animation, this.__animationDuration, function() {
                this._model.set('opening', false);
            }.bind(this));
        },
    }
});
