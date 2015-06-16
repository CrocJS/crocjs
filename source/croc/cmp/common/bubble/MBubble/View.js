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
        
        this._model.on('change', 'onBeforeOpen', function(params) {
            this.__initParentBubble();
            if (this.__parentBubble && this.__parentBubble.getClosing()) {
                params.prevent();
            }
            else {
                this.__resolveTarget(true);
            }
        }.bind(this));
        
        this._model.on('change', 'onOpen', this.onOpen.bind(this));
        this._model.on('change', 'onReposition', this.onReposition.bind(this));
        
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
         * Adjust coordinates for fixed bubble/target and for scrolled area
         * @param {{left: number, top: number}|boolean} [coors]
         * @param {boolean} [container=false]
         * @returns {{left: number, top: number}}
         * @protected
         */
        adjustCoorsForScrolling: function(coors, container) {
            if (typeof coors !== 'object') {
                container = coors;
                coors = {left: 0, top: 0};
            }
            if (container) {
                coors.left -= $(window).scrollLeft();
                coors.top -= $(window).scrollTop();
                if (this.__isFixed) {
                    var delta = this.adjustCoorsForScrolling();
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
            return this.getElement();
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         */
        isClosingOnHtmlClickAllowed: function(targetEl) {
            var el = this.getElement();
            return targetEl.closest(document.body).length &&
                (!croc.utils.domIsElementOpenerOf(el, targetEl)) &&
                (!targetEl.closest(el).length);
        },
        
        onClose: function(quick) {
            this._model.set('opening', false);
            this._model.set('closing', false);
            var hideAnimation = !quick && this._data.hideAnimation;
            
            this.__fixMobileTapFall();
            
            if (hideAnimation) {
                this.__hideAnimation(hideAnimation);
            }
            else {
                this._widget.getWrapperElement().stop(true);
                this._widget.setShown(false);
            }
        },
        
        onOpen: function() {
            var showAnimation = this._data.showAnimation;
            var element = this._widget.getWrapperElement();
            
            if (showAnimation) {
                element.css('opacity', 0);
            }
            
            element.css({visibility: 'hidden'});
            if (!this._options.forbidPositioning) {
                element.css({left: 0, top: 0});
            }
            
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
            
            this._widget.getOpenDisposer().addCallback(function() {
                this._model.set('currentPosition', null);
                this._model.set('currentTarget', null);
            }, this);
            
            this._widget.getShowDisposer().addCallback(function() {
                this._widget.fireEvent('close');
            }, this);
        },
        
        onReposition: function() {
            var options = this._data;
            var hostElements = this.getHostElements();
            if (!options.opener && hostElements) {
                croc.utils.domLinkElementToOpener(this._widget.getWrapperElement(), hostElements);
            }
            
            if (options.forbidPositioning) {
                this._widget.fireEvent('beforePosition');
                this._widget.fireEvent('beforePositionApply', this.getElement().offset(), {}, function() {});
                return;
            }
            
            var bubbleCss = {};
            var jointCss = {};
            
            if (options.customReposition) {
                this._widget.fireEvent('beforePosition');
                options.customReposition(this, bubbleCss, jointCss);
            }
            else {
                var parent = hostElements;
                parent = parent ? parent.eq(0) : this.__openerEl;
                if (parent && parent[0] !== window && parent[0] !== document.documentElement) {
                    while (parent && parent.length && parent[0] !== document.body) {
                        if (parent.css('position') === 'fixed') {
                            this._widget.getWrapperElement().css('position', 'fixed');
                            this.__fixedHost = parent;
                            break;
                        }
                        parent = parent.parent();
                    }
                }
                this.__isFixed = this._widget.getWrapperElement().css('position') === 'fixed';
                this.__nativeReposition(bubbleCss, jointCss);
            }
            
            this.setZIndex();
            
            if (options._skipElementLeft) {
                delete bubbleCss.left;
            }
            if (options._skipElementTop) {
                delete bubbleCss.top;
            }
            
            var prevented = false;
            this._widget.fireEvent('beforePositionApply', bubbleCss, jointCss, function() { prevented = true; });
            if (prevented) {
                return;
            }
            
            this.getElement().css(bubbleCss);
            var jointEl = this.getJointEl();
            if (jointEl && !_.isEmpty(jointCss)) {
                jointEl.css(jointCss);
            }
            
            this._widget.checkResize('reposition');
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
            
            if (this._data._upperZIndexLayer) {
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
         * Fixes the case when tap falls through bubble when it's closing
         * @private
         */
        __fixMobileTapFall: function() {
            if (Stm.env.device !== 'desktop') {
                var element = this._widget.getWrapperElement();
                var elOffset = element.offset();
                this.adjustCoorsForScrolling(elOffset);
                
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
            
            var options = this._data;
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
            return this.getElement().closest('.b-overlay').length ?
            {left: 0, top: 0} : {left: win.scrollLeft(), top: win.scrollTop()};
        },
        
        /**
         * @param type
         * @private
         */
        __hideAnimation: function(type) {
            var element = this._widget.getWrapperElement();
            var curPos = this._data.currentPosition;
            curPos = !curPos || curPos === 'center' ? 'top' : curPos;
            var animation = {};
            var axis = curPos === 'left' || curPos === 'right' ? 'left' : 'top';
            
            this._model.set('closing', true);
            
            switch (type) {
                case 'fly':
                    animation.opacity = 0;
                    var shift = (curPos === 'left' || curPos === 'top' ? -1 : 1) * croc.cmp.common.bubble.MBubble.__FLY_OFFSET;
                    animation[axis] = parseInt(element.css(axis), 10) + shift;
                    break;
                
                case 'slide':
                    animation = {top: -element.height()};
                    break;
                
                case 'fade':
                    animation.opacity = 0;
            }
            
            element.stop(true);
            if (this._data.hideAnimationDelay) {
                element.delay(this._data.hideAnimationDelay);
            }
            element.animate(animation, this._data.animationDuration, function() {
                this._widget.setShown(false);
                this._model.set('closing', false);
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initParentBubble: function() {
            //close on parent bubble close
            [
                this._widget.getTargetElement(),
                this.__openerEl,
                this._data.controlWidget && this._data.controlWidget.getElement()
            ]
                .some(function(placeEl) {
                    if (placeEl) {
                        var parentBubbleEl = placeEl.closest('.js-bubble');
                        var parentBubble = parentBubbleEl.length && croc.cmp.Widget.getByElement(parentBubbleEl);
                        if (parentBubble) {
                            this.__parentBubble = parentBubble;
                            this._widget.getOpenDisposer().addListener(parentBubble, 'beforeClose', function() {
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
            var curPos = this._widget.getPosition();
            this._model.set('currentPosition', curPos);
            var options = this._data;
            
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
                
                _.assign(jointCss, {left: '', top: ''});
                
                this._widget.fireEvent('beforePosition');
                
                //todo optimize здесь можно оптимизировать
                var target = this.__resolveTarget();
                
                //переменная содержит потенциальное значение для bestPositionValue. Если переменная отлична от null
                //значит для данной позиции bubble не вмещается на экран полностью.
                var continueWith = 1;
                var isCenter = curPos === 'center';
                var leftOrRight = curPos === 'left' || curPos === 'right';
                var inset = options.positionInset;
                
                //расстояние от края target до края bubble
                var distance = options.offset || 0;
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
                    bubbleCss.left = options.hAlign === 'left' ? target.left :
                        options.hAlign === 'right' ? target.left + target.width - elWidth :
                        target.left + target.width / 2 - elWidth / 2;
                    bubbleCss.left += secondDistance;
                }
                else {
                    bubbleCss.top = options.vAlign === 'top' ? target.top :
                        options.vAlign === 'bottom' ? target.top + target.height - elHeight :
                        target.top + target.height / 2 - elHeight / 2;
                    bubbleCss.top += secondDistance;
                }
                
                //позиционируем стрелку
                _.assign(jointCss, {
                    left: leftOrRight ? '' :
                        options.hAlign === 'right' ?
                            Math.min(Math.max(elWidth - target.width / 2, minIntersection),
                                elWidth - minIntersection) :
                            options.hAlign === 'left' ?
                                Math.max(Math.min(target.width / 2, elWidth - minIntersection), minIntersection) :
                            elWidth / 2,
                    top: !leftOrRight ? '' :
                        options.vAlign === 'bottom' ?
                            Math.min(Math.max(elHeight - target.height / 2, minIntersection),
                                elHeight - minIntersection) :
                            options.vAlign === 'top' ?
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
                this.adjustCoorsForScrolling(winOffset, true);
                
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
            var opener = this._data.opener;
            var el = this.getElement();
            if (opener) {
                this.__openerEl = croc.cmp.Widget.resolveElement(opener);
                croc.utils.domLinkElementToOpener(this._widget.getWrapperElement(), this.__openerEl);
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
            var options = this._data;
            
            this._widget.startCloseTimeout();
            
            if (options.closeOnHtmlClick) {
                this._widget.getShowDisposer().addCallback(croc.utils.domStableClick($(document), function(e) {
                    if (this.isClosingOnHtmlClickAllowed($(e.target))) {
                        this._widget.close();
                    }
                }, this));
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
                    .addCallback(croc.utils.domListenScrolling(this.getElement(), onScroll));
            }
            
            this._widget.listenProperty('keepActualPosition', this.__applyKeepActualPosition, this);
        },
        
        /**
         * @private
         */
        __repositionAutoSize: function(isCenter, leftOrRight, target) {
            if (this._data.autoSize) {
                var prefix = this._data.autoSizeKind ? this._data.autoSizeKind + '-' : '';
                var sizable = this.getSizeableElement();
                sizable.css(prefix + 'width',
                    isCenter || !leftOrRight ? target.width - this._data.autoSizeGap * 2 : '');
                sizable.css(prefix + 'height',
                    isCenter || leftOrRight ? target.height - this._data.autoSizeGap * 2 : '');
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
                    
                    var offset = el.offset();
                    if (offset) {
                        this.adjustCoorsForScrolling(offset);
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
        }
    }
});
