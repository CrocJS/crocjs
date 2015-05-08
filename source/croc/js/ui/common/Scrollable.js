//+use bower:jquery-mousewheel

/**
 * Добавляет скроллбары и возможность прокрутки колёсиком мыши для прокручиваемой области.
 * Если переданному элементу соответствует виджет, то реагирует на его события apper и resize.
 * На элементе должен быть класс g-scrollable, на внутреннем контейнере, который содержит контент, должен быть класс
 * g-scrollable-h. Если корневой элемент является этим контейнером, то класс g-scrollable-h не обязателен. Однако в
 * этом случае скроллбары добавлены не будут (будет работать только прокрутка колёсиком мыши).
 * @see /prototypes/gui/system/g-scrollable.html
 */
croc.Class.define('croc.ui.common.Scrollable', {
    extend: croc.Object,
    
    statics: {
        /**
         * @private
         * @static
         */
        __TEMPLATE_BAR: '' +
        '<div class="g-scrollable-bar orient_{orient} size_{size}">' +
        '   <div class="g-scrollable-bar-padding"></div>' +
        '   <div class="g-scrollable-bar-button"><div class="g-scrollable-bar-button-h"></div></div>' +
        '</div>'
    },
    
    properties: {
        /**
         * Виден ли хотя бы один скролл
         * @type {boolean}
         */
        scrollable: {
            __setter: null,
            value: false,
            event: true
        }
    },
    
    options: {
        /**
         * Область скроллится дискретно между блоками, которые определяет опция {@link #discreteScrollingItems}
         * @type {boolean}
         */
        discreteScrolling: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Определяет блоки, между которыми будет скроллиться область
         * @type {string|function(jQuery):jQuery}
         */
        discreteScrollingItems: {
            value: '>*'
        },
        
        /**
         * Запас между краем области и блоком, который остаётся при дискретном скроллинге
         * @type {number}
         */
        discreteScrollingGap: {
            type: 'number',
            value: 0
        },
        
        /**
         * Дискретный скроллинг строгий, выравнивание всегда строго по левому/верхнему краю дочернего элемента
         * @type {boolean}
         */
        discreteScrollingStrict: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Корневой элемент (g-scrollable)
         * @type {jQuery}
         */
        el: {},
        
        /**
         * Видимость скроллбаров:
         * visible - видимы всегда
         * hidden - появляются при наведении мыши на область
         * abstract - невидимы никогда
         * @type {string}
         */
        visibility: {
            check: ['visible', 'hidden', 'abstract'],
            value: 'visible'
        },
        
        /**
         * Реагировать на колёсико мыши
         * @type {boolean}
         */
        useMousewheel: {
            type: 'boolean',
            value: true
        },
        
        /**
         * Ориентация скроллбара/скроллбаров
         * @type {string}
         */
        orientation: {
            check: ['vertical', 'horizontal', 'both'],
            value: 'vertical'
        },
        
        /**
         * Размеры скроллбара
         * @type {string}
         */
        size: '1'
    },
    
    construct: function(options) {
        croc.ui.common.Scrollable.superclass.__construct__.apply(this, arguments);
        
        this.__el = options.el;
        this.__scrollableEl = this.__el.find('.g-scrollable-h');
        if (this.__scrollableEl.length === 0) {
            this.__scrollableEl = this.__el;
        }
        this.__widget = croc.ui.Widget.getByElement(this.__el);
        this.__useMousewheel = options.useMousewheel;
        this.__discreteScrollingItems = options.discreteScrollingItems;
        this.__discreteScrollingStrict = options.discreteScrollingStrict;
        this.__discreteScrollingGap = options.discreteScrollingGap;
        this.__discreteScrolling = options.discreteScrolling;
        this.__enableDiscreteScrolling = true;
        
        if (this.__widget) {
            this.__widget.onAppear(this.__initialize.bind(this, options));
        }
        else {
            this.__initialize(options);
        }
    },
    
    members: {
        /**
         * Центрировать область на переданном блоке
         * @param {jQuery} block
         * @param {boolean} [animate=false]
         */
        centerTo: function(block, animate) {
            var coors = {};
            if (this.__bars.ver) {
                var scrollHeight = this.__scrollableEl[0].clientHeight;
                coors.top = block[0].offsetTop - scrollHeight / 2 + block.outerHeight() / 2;
            }
            if (this.__bars.hor) {
                var scrollWidth = this.__scrollableEl[0].clientWidth;
                coors.left = block[0].offsetLeft - scrollWidth / 2 + block.outerWidth() / 2;
            }
            
            this.goTo(coors, animate);
        },
        
        /**
         * Элементы получаемые на основе {@link #discreteScrollingItems}
         * todo optimize
         * @returns {jQuery}
         */
        getDiscreteElements: function() {
            var items = this.__discreteScrollingItems;
            return typeof items === 'string' ? this.__scrollableEl.find(items) :
                typeof items === 'function' ? items(this.__scrollableEl) : items;
        },
        
        /**
         * Горизонтальный скроллбар
         * @return {croc.ui.form.field.Slider}
         */
        getHBar: function() {
            return this.__bars.hor;
        },
        
        /**
         * Вертикальный скроллбар
         * @return {croc.ui.form.field.Slider}
         */
        getVBar: function() {
            return this.__bars.ver;
        },
        
        /**
         * Контейнер с прокручиваемым контентом (g-scrollable-h)
         * @return {jQuery}
         */
        getScrollableElement: function() {
            return this.__scrollableEl;
        },
        
        /**
         * Прокрутить область на заданную точку {left, top}
         * @param {{[left]: number, [top]: number}} coors
         * @param {boolean} [animate=false]
         */
        goTo: function(coors, animate) {
            if (animate) {
                this.__enableDiscreteScrolling = false;
                this.__scrollableEl.stop(true).animate(_.transform(coors, function(result, value, key) {
                    result['scroll' + croc.utils.strUcFirst(key)] = value;
                }), function() {
                    this.__enableDiscreteScrolling = true;
                }.bind(this));
            }
            else {
                if (coors.left) {
                    this.__scrollableEl.scrollLeft(coors.left);
                }
                if (coors.top) {
                    this.__scrollableEl.scrollTop(coors.top);
                }
            }
        },
        
        /**
         * Обновить/перерисовать скроллбары
         */
        update: function() {
            if (!this.__bars) {
                return;
            }
            
            var scrollableEl = this.__scrollableEl[0];
            var vBar = this.__bars.ver;
            var hBar = this.__bars.hor;
            
            if (vBar) {
                var height = scrollableEl.clientHeight;
                var scrollHeight = scrollableEl.scrollHeight;
                if (height >= scrollHeight) {
                    vBar.setShown(false);
                }
                else {
                    vBar.setMax(scrollHeight - height);
                    vBar.setShown(true);
                    vBar.setDraggableElementLength(
                        Math.max(20, height / scrollHeight * vBar.getElement().outerHeight()), false);
                }
            }
            
            if (hBar) {
                var width = scrollableEl.clientWidth;
                var scrollWidth = scrollableEl.scrollWidth;
                if (width >= scrollWidth) {
                    hBar.setShown(false);
                }
                else {
                    hBar.setMax(scrollWidth - width);
                    hBar.setShown(true);
                    hBar.setDraggableElementLength(
                        Math.max(20, width / scrollWidth * hBar.getElement().outerWidth()), false);
                }
            }
            
            this.__setScrollable(!!((vBar || hBar) && (vBar && vBar.getShown() || hBar && hBar.getShown())));
            this.__el.toggleClass('scroll_both', !!(vBar && vBar.getShown() && hBar && hBar.getShown()));
            
            this.__updateBarsValues();
        },
        
        /**
         * @private
         */
        __initialize: function(options) {
            var scrollableEl = this.__scrollableEl;
            this.__bars = {};
            
            this.__el.addClass('scroll_' + options.visibility);
            
            ['horizontal', 'vertical'].forEach(function(orientation) {
                if (options.orientation === orientation || options.orientation === 'both') {
                    var orient = orientation.substr(0, 3);
                    var barEl = options.visibility === 'abstract' || scrollableEl === this.__el ? croc.ui.Widget.FICTIVE :
                        $(croc.ui.common.Scrollable.__TEMPLATE_BAR.render({
                            orient: orient,
                            size: options.size
                        })).appendTo(this.__el);
                    
                    this.__bars[orient] = new croc.ui.form.field.Slider({
                        el: barEl,
                        orientation: orientation,
                        draggableAreaClick: options.visibility === 'visible',
                        draggableAreaSelector: null,
                        draggableSelector: '.g-scrollable-bar-button',
                        animation: false,
                        transformValueFn: !options.discreteScrolling ? null :
                            this.__transformSliderValue.bind(this, orient)
                    });
                }
            }, this);
            
            this.__setUpBehavior();
            
            if (Stm.env.ldevice !== 'desktop') {
                croc.util.Mobile.scrollFix(this.__scrollableEl);
            }
        },
        
        /**
         * @private
         */
        __setUpBehavior: function() {
            var vBar = this.__bars.ver;
            var hBar = this.__bars.hor;
            var barsValueChange = false;
            
            this.__scrollableEl.on('scroll', function() {
                if (!this.__interaction && !barsValueChange && !_(this.__bars).invoke('getDragging').some()) {
                    this.__updateBarsValues();
                }
            }.bind(this));
            
            if (this.__useMousewheel) {
                var setBarValue = function(orient, delta, factor) {
                    var bar = this.__bars[orient];
                    delta = delta * factor;
                    
                    //если при дискретном скроллинге шаг скроллинга меньше длины элемента, то увеличиваем шаг до
                    //длины элемента
                    if (this.__enableDiscreteScrolling && this.__discreteScrolling) {
                        var element = this.getDiscreteElements().eq(0);
                        var elementDim = element.length && (orient === 'hor' ? element.outerWidth() : element.outerHeight());
                        if (elementDim && Math.abs(delta) < elementDim) {
                            delta = elementDim * (delta > 0 ? 1 : -1);
                        }
                    }
                    
                    bar.setValue(bar.getValue() - delta);
                }.bind(this);
                
                this.__el.on('mousewheel', function(e) {
                    if (croc.util.Browser.isIE(8)) {
                        e.deltaFactor *= 17;
                    }
                    this.__enableDiscreteScrolling = e.deltaFactor > 30;
                    if (vBar && e.deltaY) {
                        setBarValue('ver', e.deltaY, e.deltaFactor);
                    }
                    if (hBar && e.deltaX) {
                        setBarValue('hor', e.deltaX, e.deltaFactor);
                    }
                    else if (!vBar && hBar && e.deltaY) {
                        setBarValue('hor', e.deltaY, e.deltaFactor);
                    }
                    
                    if ((vBar && vBar.getShown()) || (hBar && hBar.getShown())) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }.bind(this));
            }
            
            _.forOwn(this.__bars, function(bar, orient) {
                var scrollFn = _.throttle(this.disposableFunc(function(value) {
                    barsValueChange = true;
                    
                    if (orient === 'ver') {
                        this.__scrollableEl.scrollTop(value);
                    }
                    else {
                        this.__scrollableEl.scrollLeft(value);
                    }
                    
                    this._getDisposer().setTimeout(function() {
                        barsValueChange = false;
                    }.bind(this), 25);
                }, this), 25);
                
                bar.on('changeValue', function(value) {
                    if (!this.__interaction) {
                        scrollFn(value);
                    }
                }, this);
                
                //когда пользователь отпустил ползунок вычисляем нужно ли сделать fakeEnd у скроллбара
                if (this.__discreteScrolling && this.__discreteScrollingStrict) {
                    croc.Object.listenProperties(
                        bar, 'value',
                        bar, 'dragging',
                        _.debounce(this.disposableFunc(function(value, dragging) {
                            if (!dragging) {
                                var barValue = value +
                                    this.getDiscreteElements().last()['outer' + (orient === 'hor' ? 'Width' : 'Height')]();
                                if (barValue > bar.getMax()) {
                                    bar.fakeEnd();
                                }
                            }
                        }, this), 0));
                }
            }, this);
            
            var updateDebounce = _.debounce(this.disposableFunc(this.update, this), 5);
            
            if (this.__widget) {
                this.__widget.on('resize', updateDebounce);
                this.__widget.on('appear', this.update, this);
            }
            
            this.update();
        },
        
        /**
         * @param orient
         * @param value
         * @param [old]
         * @param [options]
         * @return {number}
         * @private
         */
        __transformSliderValue: function(orient, value, old, options) {
            if (!this.__enableDiscreteScrolling) {
                return value;
            }
            
            var scrollableEl = this.__scrollableEl;
            var elements = this.getDiscreteElements();
            
            if (elements.length === 0) {
                return 0;
            }
            var side = orient === 'hor' ? 'Left' : 'Top';
            var prop = 'offset' + side;
            var margin = 'margin' + side;
            var padding = 'padding' + side;
            var scrollPadding = croc.utils.domNumericCss(scrollableEl, padding);
            var scrollLength = orient === 'hor' ?
                scrollableEl[0].scrollWidth : scrollableEl[0].scrollHeight;
            var clientLength = orient === 'hor' ?
                scrollableEl[0].clientWidth : scrollableEl[0].clientHeight;
            var gap = 5;
            
            if (this.__discreteScrollingStrict && clientLength > scrollLength - value) {
                value = scrollLength - clientLength;
            }
            
            function getCoor(index, dir) {
                var coor = elements[index][prop];
                var nextCoor = null;
                
                if (dir) {
                    var nextCoorIndex = index;
                    while (nextCoorIndex + dir >= 0 && nextCoorIndex + dir < elements.length) {
                        nextCoorIndex += dir;
                        nextCoor = elements[nextCoorIndex][prop];
                        if (nextCoor !== coor) {
                            break;
                        }
                    }
                }
                
                var el = elements.eq(index);
                return nextCoor !== null ? (coor + nextCoor) / 2 :
                coor - croc.utils.domNumericCss(el, margin) - croc.utils.domNumericCss(el, padding) - scrollPadding;
            }
            
            var index = croc.utils.arrBinarySearch(elements.get(), function(el, index) {
                var coor = getCoor(index, 1);
                
                if (index === 0) {
                    return coor >= value - gap ? 0 : -1;
                }
                else {
                    var lastCoor = getCoor(index, -1);
                    return lastCoor < value - gap && coor >= value - gap ? 0 : coor - value + gap;
                }
            });
            if (index === -1) {
                index = elements.length - 1;
            }
            value = getCoor(index) - this.__discreteScrollingGap;
            
            if (this.__discreteScrollingStrict && clientLength > scrollLength - value) {
                return getCoor(index - 1) - this.__discreteScrollingGap;
            }
            return value;
        },
        
        /**
         * @private
         */
        __updateBarsValues: function() {
            var vBar = this.__bars.ver;
            var hBar = this.__bars.hor;
            
            this.__interaction = true;
            
            if (vBar) {
                if (!vBar.setValue(this.__scrollableEl.scrollTop())) {
                    vBar.redraw();
                }
            }
            
            if (hBar) {
                if (!hBar.setValue(this.__scrollableEl.scrollLeft())) {
                    hBar.redraw();
                }
            }
            
            this.__interaction = false;
        }
    }
});