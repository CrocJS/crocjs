croc.ns('croc.ui.form.field');

/**
 * Слайдер (ползунок для выбора числового значения из заданного диапазона)
 * @extends {croc.ui.Container}
 * @mixes {croc.ui.form.field.MStandardField}
 * @implements {croc.ui.form.field.IField}
 * @event changeValue (value: number)
 */
croc.Class.define('croc.ui.form.field.Slider', {
    extend: croc.ui.Container,
    implement: croc.ui.form.field.IField,
    include: croc.ui.form.field.MStandardField,
    
    properties: {
        /**
         * В данный момент происходит перемещение слайдера
         * @type {boolean}
         */
        dragging: {
            value: false,
            event: true
        },
        
        /**
         * Правая граница диапазона значений (может быть меньше чем min)
         * @type {number}
         */
        max: {
            value: 100,
            apply: function() {
                this.__onChangeRange();
                this.redraw();
            },
            event: true,
            option: true
        },
        
        /**
         * Левая граница диапазона значений (может быть больше чем max)
         * @type {number}
         */
        min: {
            value: 0,
            apply: function() {
                this.__onChangeRange();
                this.redraw();
            },
            event: true,
            option: true
        },
        
        /**
         * Скин
         * @type {string}
         */
        skin: {
            cssClass: true,
            option: true
        },
        
        /**
         * Значение слайдера
         * @type {number}
         */
        value: {
            type: 'number',
            transform: function(value) {
                return this.__normalizeValue(value);
            },
            apply: '__applyValue',
            event: true,
            option: true
        }
    },
    
    options: {
        /**
         * Анимировать ли ползунок при изменении значения
         * @type {boolean}
         */
        animation: {
            type: 'boolean',
            value: true
        },
        
        /**
         * Шаг, на который увеличивается/уменьшается значение при клике по кнопке вперёд/назад
         * @type {number}
         */
        buttonsStep: 10,
        
        /**
         * Происходит ли перетаскивание ползунка при клике на область перетаскивания
         * @type {boolean}
         */
        draggableAreaClick: {
            type: 'boolean',
            value: true
        },
        
        /**
         * Селектор элемента-области, внутри которой просиходит перетаскивание ползунка
         * @type {string}
         */
        draggableAreaSelector: '.b-slider-draggable-area',
        
        /**
         * Селектор ползунка
         * @type {string}
         */
        draggableSelector: '.b-slider-draggable',
        
        /**
         * Шаблон по-умолчанию
         * @type {string|$.Deferred}
         */
        htmlTemplate: '' +
        '<div class="b-slider orient_{orient} {skin}{cls}">' +
        '   {items::buttonPrev}' +
        '   <div class="b-slider-draggable-area">' +
        '       <div class="b-slider-draggable-area-h">' +
        '           {items::draggable}' +
        '       </div>' +
        '   </div>' +
        '   {items::buttonNext}' +
        '</div>',
        
        /**
         * Ориентация слайдера ('vertical', 'horizontal')
         * @type {string}
         */
        orientation: {
            check: ['horizontal', 'vertical'],
            value: 'horizontal'
        },
        
        /**
         * Функция трансформации значения слайдера
         * @type {function(number):number}
         */
        transformValueFn: {
            type: 'function'
        }
    },
    
    members: {
        /**
         * Размещает ползунок в самом конце скроллбара, но при этом значение поля не меняется
         */
        fakeEnd: function() {
            this.__setButtonPosition(this.getMax());
        },
        
        /**
         * 'button'|'slide'
         * @return {string}
         */
        getInteractionType: function() {
            return this.__interactionType;
        },
        
        /**
         * является ли ориентация слайдера горизонтальной
         * @returns {boolean}
         */
        isHorizontal: function() {
            return this.__orientation === 'horizontal';
        },
        
        /**
         * Уведомить виджет о том, что размеры рамок изменились
         * @param {string} [reason]
         */
        onResize: function(reason) {
            croc.ui.form.field.Slider.superclass.onResize.apply(this, arguments);
            this.redraw();
        },
        
        /**
         * Пересчитать позицию ползунка
         */
        redraw: function() {
            this.__setButtonPosition(this.getValue());
        },
        
        /**
         * Изменить протяжённость ползунка
         * @param {number} length
         * @param {boolean} [redraw=true]
         */
        setDraggableElementLength: function(length, redraw) {
            if (!this.__draggable) {
                return;
            }
            
            this.__draggable.getElement()[this.isHorizontal() ? 'width' : 'height'](length);
            if (redraw === undefined || redraw) {
                this.redraw();
            }
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.form.field.Slider.superclass._getAddRenderData.apply(this, arguments), {
                orient: this.__orientation.substr(0, 3)
            });
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.Slider.superclass._initWidget.call(this);
            
            this.__draggableAreaEl = this.__draggableAreaSelector ?
                this.getElement().find(this.__draggableAreaSelector) : this.getElement();
            
            if (!this.__draggable.getElement()) {
                delete this.__draggable;
            }
            
            this.__onChangeRange();
            
            if (!this.setValue(this.getValue())) {
                this.__applyValue(this.getValue());
            }
            
            this.__setUpButtons();
            this.__setUpDrag();
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.Slider.superclass._onPropertiesInitialized.apply(this, arguments);
            
            this.__orientation = options.orientation;
            this.__animation = options.animation;
            this.__buttonsStep = options.buttonsStep;
            this.__draggableAreaClick = options.draggableAreaClick;
            this.__draggableAreaSelector = options.draggableAreaSelector;
            this.__draggableSelector = options.draggableSelector;
            this.__transformValueFn = options.transformValueFn;
            
            options.items.items = [
                this.__buttonPrev = new croc.ui.form.Button({
                    identifier: 'buttonPrev',
                    size: '1',
                    extraCls: 'clip_rect b-slider-button-prev',
                    icon: {html: '<span class="ico mod_slider-prev"><i></i></span>'}
                }),
                
                this.__buttonNext = new croc.ui.form.Button({
                    identifier: 'buttonNext',
                    size: '1',
                    extraCls: 'clip_rect b-slider-button-next',
                    icon: {html: '<span class="ico mod_slider-next"><i></i></span>'}
                }),
                
                this.__draggable = new croc.ui.form.Button({
                    identifier: 'draggable',
                    size: '1',
                    extraCls: 'b-slider-draggable'
                })
            ];
        },
        
        /**
         * Поиск элементов DOM для всех дочерних элементов
         * @param {jQuery} el
         * @return {Object.<string, jQuery>}
         * @protected
         */
        _scanForItemsElements: function(el) {
            return {
                items: _.transform({
                    buttonPrev: el.find('.b-slider-button-prev'),
                    buttonNext: el.find('.b-slider-button-next'),
                    draggable: el.find(this.__draggableSelector)
                }, function(result, el, key) {
                    if (el.length) {
                        result[key] = el;
                    }
                })
            };
        },
        
        /**
         * @param value
         * @param old
         * @param {Object} [options]
         * @param {boolean} [options.dontRedraw=false]
         * @private
         */
        __applyValue: function(value, old, options) {
            if (!options || !options.dontRedraw) {
                this.__setButtonPosition(this.getValue(), this.__interactionType !== 'slide' && this.__animation);
            }
            this.__interactionType = null;
            
            if (this.__buttonPrev) {
                this.__buttonPrev.setDisabled(value === this.getMin());
            }
            
            if (this.__buttonNext) {
                this.__buttonNext.setDisabled(value === this.getMax());
            }
        },
        
        /**
         * @param {jQuery} el
         * @returns {number}
         * @private
         */
        __getElementLength: function(el) {
            return this.isHorizontal() ? el.width() : el.height();
        },
        
        /**
         * @param {jQuery} el
         * @returns {number}
         * @private
         */
        __getElementOffset: function(el) {
            return this.isHorizontal() ? el.offset().left : el.offset().top;
        },
        
        /**
         * @return {number}
         * @private
         */
        __getSlideLength: function() {
            return this.__getElementLength(this.__draggableAreaEl) - this.__getElementLength(this.__draggable.getElement());
        },
        
        /**
         * @param {number} value
         * @param {boolean} [dontUseTransformFn=false]
         * @returns {number}
         * @private
         */
        __normalizeValue: function(value, dontUseTransformFn) {
            if (this.__transformValueFn && !dontUseTransformFn) {
                value = this.__transformValueFn(value);
            }
            
            return !this.$$preConstructed ? value :
                value === null ? this.getMin() :
                    this.__direction === 1 ?
                        Math.min(this.getMax(), Math.max(this.getMin(), value)) :
                        Math.max(this.getMax(), Math.min(this.getMin(), value));
        },
        
        /**
         * @private
         */
        __onChangeRange: function() {
            this.__valuesRange = Math.abs(this.getMax() - this.getMin());
            this.__direction = this.getMax() > this.getMin() ? 1 : -1;
        },
        
        /**
         * @param value
         * @param [animate=false]
         * @private
         */
        __setButtonPosition: function(value, animate) {
            var draggableEl = this.__draggable && this.__draggable.getElement();
            if (!draggableEl) {
                return;
            }
            
            value = this.__normalizeValue(value, true);
            
            var css = {};
            css[this.isHorizontal() ? 'left' : 'top'] =
                this.__getSlideLength() / this.__valuesRange * (value - this.getMin()) * this.__direction;
            
            if (animate) {
                draggableEl.stop(true).animate(css, 'fast');
            }
            else {
                draggableEl.css(css);
            }
        },
        
        /**
         * @private
         */
        __setUpButtons: function() {
            if (this.__buttonPrev.getElement()) {
                this.__buttonPrev.on('execute', function() {
                    this.__interactionType = 'button';
                    this.setValue(this.getValue() - this.__buttonsStep * this.__direction);
                }, this);
            }
            else {
                delete this.__buttonPrev;
            }
            
            if (this.__buttonNext.getElement()) {
                this.__buttonNext.on('execute', function() {
                    this.__interactionType = 'button';
                    this.setValue(this.getValue() + this.__buttonsStep * this.__direction);
                }, this);
            }
            else {
                delete this.__buttonNext;
            }
        },
        
        /**
         * @private
         */
        __setUpDrag: function() {
            if (!this.__draggableAreaEl.length) {
                return;
            }
            
            var draggableEl = this.__draggable.getElement();
            
            var draggable = new croc.util.Draggable({
                el: this.__draggableAreaEl,
                maxPos: Number.MAX_VALUE,
                horizontal: this.isHorizontal(),
                
                startFrom: function(e) {
                    var start = this.__getElementOffset(this.__draggableAreaEl);
                    if ($(e.target).closest(draggableEl).length > 0) {
                        start += (this.isHorizontal() ? e.pageX : e.pageY) - this.__getElementOffset(draggableEl);
                    }
                    else if (!this.__draggableAreaClick) {
                        return undefined;
                    }
                    else {
                        start += this.__getElementLength(draggableEl) / 2;
                    }
                    
                    return start;
                }.bind(this),
                
                onDrag: function(x) {
                    this.__interactionType = 'slide';
                    var value = this.__valuesRange / this.__getSlideLength() * x * this.__direction + this.getMin();
                    this.__setButtonPosition(value);
                    this.setValue(value, {dontRedraw: true});
                }.bind(this),
                
                onDragStart: function() {
                    this.setDragging(true);
                    this.__draggable.setActive(true);
                }.bind(this),
                
                onDragEnd: function() {
                    this.setDragging(false);
                    this.__draggable.setActive(false);
                    this.redraw();
                }.bind(this)
            });
        }
    }
});
