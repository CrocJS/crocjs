/**
 * Полоса с ползунками для установки значения или диапазона значений.
 */
croc.Class.define('croc.ui.form.field.TrackBar', {
    extend: croc.ui.Widget,
    implement: croc.ui.form.field.IField,
    include: croc.ui.form.field.MStandardField,
    
    statics: {
        /**
         * @private
         * @static
         */
        __GRAPH_BAR_WIDTH: 5,
        
        /**
         * @private
         * @static
         */
        __MARKER_POSSIBLE_MARGIN: 15,
        
        /**
         * @private
         * @static
         */
        __SLIDER_INDENT: 14
    },
    
    properties: {
        instantValue: {
            type: ['array', 'number'],
            compare: croc.utils.arrEqual,
            transform: '__transformValue',
            apply: function() {
                if (this.__isRange) {
                    this.__applyRangeValue.apply(this, arguments);
                }
                else {
                    this.__applySingleValue.apply(this, arguments);
                }
            },
            event: true
        },
        
        value: {
            type: ['array', 'number'],
            compare: croc.utils.arrEqual,
            transform: '__transformValue',
            apply: function(value) {
                this.setInstantValue(value);
            },
            option: true,
            event: true
        },
        
        suggestedRange: {
            type: 'array',
            apply: '__applySuggestedRange',
            option: true
        }
    },
    
    options: {
        fractionDigits: {
            type: 'number',
            value: 0
        },
        
        /**
         * Данные для построения графика (отображается при таскании ползунка)
         * Ключи: min {number}, max {number}, data {Array.<object>}
         * @type {object}
         */
        graph: {
            type: 'object'
        },
        
        markers: {
            type: 'array'
        },
        
        minField: {
            type: 'croc.ui.form.field.IField'
        },
        
        maxField: {
            type: 'croc.ui.form.field.IField'
        },
        
        range: {
            type: 'boolean',
            value: true
        },
        
        valuesRange: {
            type: 'array'
        }
    },
    
    members: {
        bindFields: function(minField, maxField) {
            var internalSetValue = false;
            
            //direct bind
            var directBind = function(min, field, secondField) {
                var fieldValueListener = function(value, processErrors) {
                    value = parseFloat(value && value.replace(/ /g, ''));
                    var secondValue = parseFloat(secondField.getValue() && secondField.getValue().replace(/ /g, ''));
                    if (isNaN(value)) {
                        value = min ? this.__min : this.__max;
                    }
                    if (isNaN(secondValue)) {
                        secondValue = min ? this.__max : this.__min;
                    }
                    
                    internalSetValue = true;
                    if (min ? value > secondValue : value < secondValue) {
                        if (processErrors) {
                            this.setValue([this.__min, this.__max]);
                        }
                    }
                    else {
                        this.setValue(min ? [value, secondValue] : [secondValue, value]);
                    }
                    internalSetValue = false;
                    
                }.bind(this);
                var fieldValueListenerDebounced = _.debounce(this.disposableFunc(fieldValueListener), 200);
                
                if (croc.Interface.check(field, 'croc.ui.form.field.IUpdatableField')) {
                    field.on('changeInstantValue', function(value) {
                        if (!internalSetValue) {
                            fieldValueListenerDebounced(value);
                        }
                    });
                }
                
                field.listenProperty('value', function(value) {
                    if (!internalSetValue) {
                        fieldValueListener(value, true);
                    }
                });
            }.bind(this);
            
            directBind(true, minField, maxField);
            directBind(false, maxField, minField);
            
            //reverse bind
            var formatValue = function(min, value) {
                return (min && value <= this.__min) || (!min && value >= this.__max) ?
                    null : croc.utils.numFormat(value, 2, ' ', false);
            }.bind(this);
            
            var setFields = this.disposableFunc(function(value) {
                if (!value) {
                    value = this.getValue();
                }
                if (internalSetValue || !value) {
                    return;
                }
                
                internalSetValue = true;
                minField.setValueWithoutTransform(formatValue(true, value[0]));
                maxField.setValueWithoutTransform(formatValue(false, value[1]));
                internalSetValue = false;
            }, this);
            
            this.listenProperty('instantValue', setFields);
            
            //format fields values
            if (croc.Interface.check(minField, 'croc.ui.form.field.IHtmlControl')) {
                minField.on('blur', _.debounce(setFields, 100));
            }
            if (croc.Interface.check(maxField, 'croc.ui.form.field.IHtmlControl')) {
                maxField.on('blur', _.debounce(setFields, 100));
            }
        },
        
        /**
         * Шаблон для элемента
         * @param {Object} options
         * @return {$.Deferred|string}
         * @protected
         */
        _getTemplate: function(options) {
            return this.__isRange ?
                this._requestTemplate('cmp-trackbar') :
                this._requestTemplate('cmp-trackbar_single');
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.TrackBar.superclass._initWidget.apply(this, arguments);
            
            this.__width = this.getElement().width() - croc.ui.form.field.TrackBar.__SLIDER_INDENT;
            this.__sliderContainer = this.getElement().find('.b-trackbar-slider').width(this.__width);
            this.__hasGraphState = this.__graph && !croc.util.Browser.isIE('8');
            
            if (this.__hasGraphState) {
                this.__setUpGraphData();
            }
            
            this.__defineMarkers();
            this.__renderMarkers();
            
            if (this.getSuggestedRange()) {
                this.__applySuggestedRange(this.getSuggestedRange());
            }
            else if (this.__valuesRange) {
                this.setSuggestedRange(this.__valuesRange);
            }
            
            this.__setUpDraggable();
            
            //bind fields
            if (this.__minField && this.__maxField) {
                this.bindFields(this.__minField, this.__maxField);
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__graph = $.isEmptyObject(options.graph) ? null : options.graph;
            
            croc.ui.form.field.TrackBar.superclass._onPropertiesInitialized.apply(this, arguments);
            
            this.__markerExp = 3;
            this.__markerK = 1000;
            this.__barMinWidth = {possible: 2};
            this.__isRange = options.range;
            this.__fractionDigits = options.fractionDigits;
            this.__markers = options.markers;
            this.__minField = options.minField;
            this.__maxField = options.maxField;
            this.__valuesRange = options.valuesRange;
            
            this.setInstantValue(this.getValue());
        },
        
        /**
         * @param value
         * @param old
         * @private
         */
        __applyRangeValue: function(value, old) {
            if (this.getElement()) {
                this.getElement()
                    .find('.b-trackbar-handle-left').css({left: this.__toPercent(value[0]) + "%"}).end()
                    .find('.b-trackbar-handle-right').css({left: this.__toPercent(value[1]) + "%"}).end();
            }
            
            this.__setRangeBar(value);
        },
        
        /**
         * @param value
         * @param old
         * @private
         */
        __applySingleValue: function(value, old) {
            if (this.getElement()) {
                this.getElement().find('.b-trackbar-handle-value').css({left: this.__toPercent(value) + "%"});
            }
        },
        
        /**
         * @param value
         * @private
         */
        __applySuggestedRange: function(value) {
            this.__setRangeBar(value, true);
        },
        
        /**
         * Вычисление маркеров по диапазону
         * @private
         * @see https://redmine.sotmarket.ru/projects/redesign-code/wiki/Ползунок_с_ценами_в_каталоге#Порядок-формирования-диапазонов-ползунка
         */
        __calculateMarkers: function(range) {
            var $this = this,
                margin,
                kS, Vmin, Vmax, m1, m2;
            
            // Набор шагов, которые возможны для использования в ползунке
            var steps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
            margin = croc.ui.form.field.TrackBar.__MARKER_POSSIBLE_MARGIN;
            
            // Для преобразования координаты отображаемого ползунка в координату виртуального ползунка
            // используется коэффициент масштабирования kS
            kS = this.__markerFnReverse(10000) / this.__width;
            
            // Границы виртуальной шкалы m1 и m2
            m1 = margin * kS * 1.75;
            m2 = (this.__width - margin) * kS;
            
            // Минимальная и максимальная цена товара
            Vmin = range[0];
            Vmax = range[1];
            
            if (Math.floor(Vmin) !== Vmin || Math.floor(Vmax) !== Vmax) {
                steps.unshift(0.1);
            }
            
            if (markerToValue(0) < 0) {
                m1 = 0;
            }
            
            function markerToValue(x) {
                return (Vmax - Vmin) / ( $this.__markerFn(m2) - $this.__markerFn(m1) ) * ( $this.__markerFn(x * kS) - $this.__markerFn(m1) ) + Vmin;
            }
            
            function toStep(v) {
                var step = v;
                steps.some(function(curStep) {
                    if (step < curStep || curStep === steps[steps.length - 1]) {
                        step = curStep;
                        return true;
                    }
                    return false;
                });
                
                return step;
            }
            
            // Формируются координаты точек на ползунке (в % от его длины)
            var points,
                markers = [],
                diff = Math.floor(Vmax) - Math.floor(Vmin);
            
            if (diff < 2 || diff <= 3 && Vmin < 1) {
                if (Vmin < 1 && diff < 2) {
                    points = [0, 50, 100];
                }
                else {
                    points = [0, 35, 65, 100];
                }
            }
            else {
                points = [0, 20, 50, 80, 100];
            }
            
            // Формирование объектов маркеров (лейблы, значения, шаг)
            var prev = points[0];
            $.each(points, function(i, point) {
                
                var label, step, value,
                    x1, x0,
                    rv;
                
                x1 = point / 100 * $this.__width;
                x0 = prev / 100 * $this.__width;
                
                value = markerToValue(x1);
                rv = toStep((value - markerToValue(x0)) / 3);
                
                if (point === 100) {
                    value = Math.ceil(value / rv) * rv;
                }
                else if (point !== 0 && points.length < 5) {
                    switch (point) {
                        case 35:
                            value = Math.floor(value);
                            break;
                        case 65:
                            value = Math.ceil(value);
                            break;
                        default:
                            value = Math.round(value);
                    }
                }
                else {
                    if (Math.floor(Vmax) - Math.ceil(Vmin) >= 2) {
                        value = Math.round(value / rv) * rv;
                    }
                    else {
                        value = Math.floor(value / rv) * rv;
                    }
                }
                
                if (point === 0) {
                    label = "<";
                }
                else if (point === 100) {
                    label = ">";
                }
                else {
                    label = croc.utils.numFormat(value);
                }
                
                markers.push({
                    interval: point,
                    value: value,
                    label: label
                });
                
                
                if (x1 - x0 !== 0) {
                    step = (value - markerToValue(x0)) / (x1 - x0);
                    markers[markers.length - 2].step = toStep(step);
                }
                
                prev = this;
                
            });
            
            markers[0].value = Math.floor(markers[0].value / markers[0].step) * markers[0].step;
            if (markers[0].value === markers[1].value) {
                markers[0].value -= markers[0].step;
            }
            
            this.__markers = markers;
        },
        
        /**
         * @private
         */
        __checkMarkers: function() {
            var valid = true;
            
            if (this.__markerExp > 1) {
                var prev = false;
                this.__markers.some(function(marker) {
                    if (prev && marker.value - prev < 10) {
                        this.__markerExp--;
                        valid = false;
                        return true;
                    }
                    prev = marker.value;
                }, this);
            }
            
            return valid;
        },
        
        /**
         * Определение маркеров при инициализации компонента
         * @private
         */
        __defineMarkers: function() {
            // маркеры переданы в опциях
            if (this.__markers) {
                var markers = [];
                if (parseInt(this.__markers[0].interval, 10) !== 0) {
                    markers.push({
                        interval: 0,
                        value: 0,
                        label: '<',
                        step: 10
                    });
                }
                
                $.each(this.__markers, function() {
                    this.interval = parseInt(this.interval, 10);
                    markers.push(this);
                });
                
                if (parseInt(this.__markers[this.__markers.length - 1].interval, 10) !== 100) {
                    markers.push({
                        interval: 100,
                        value: 1000000,
                        label: '>',
                        step: 5000
                    });
                }
                
                this.__markers = markers;
                
            }
            // Вычисление маркеров по диапазону
            else if (this.__valuesRange) {
                this.__calculateMarkers(this.__valuesRange);
                while (!this.__checkMarkers()) {
                    this.__calculateMarkers(this.__valuesRange);
                }
            }
            
            this.__min = this.__markers[0].value;
            this.__max = this.__markers[this.__markers.length - 1].value;
            this.setValue([this.__min, this.__max]);
        },
        
        /**
         * @private
         */
        __drawRect: function(x, y, w, h, bgColor) {
            var context = this.__canvas.getContext('2d');
            context.beginPath();
            context.rect(x, y, w, h);
            if (bgColor) {
                context.fillStyle = bgColor;
            }
            context.fill();
        },
        
        /**
         * @private
         */
        __fromPercent: function(percent) {
            return percent / 100 * this.__width;
        },
        
        /**
         * @private
         */
        __fromPixelToPercent: function(pixel) {
            return pixel / this.__width * 100;
        },
        
        /**
         * @private
         */
        __markerFn: function(x) {
            return Math.pow(x, this.__markerExp);
        },
        
        /**
         * @private
         */
        __markerFnReverse: function(y) {
            return Math.pow(y, 1 / this.__markerExp);
        },
        
        /**
         * Обработка клика по контейнеру слайдера
         * @private
         */
        __onClickDraggable: function(e) {
            var $this = $(e.currentTarget);
            var width = this.__width;
            var value = e.pageX - $this.offset().left;
            var targetHandle;
            
            this.getElement().find('.b-trackbar-handle').each(function() {
                var d = Math.abs($(this).position().left - value);
                if (width > d) {
                    width = d;
                    targetHandle = $(this);
                }
            });
            
            if (this.__isRange) {
                if (targetHandle.hasClass('b-trackbar-handle-right')) {
                    this.setValue([null, this.__toValue(value)]);
                }
                else {
                    this.setValue([this.__toValue(value), null]);
                }
            }
            else {
                this.setValue(this.__toValue(value));
            }
        },
        
        /**
         * Метод вызываемый при таскании ползунка
         * @private
         */
        __onDraggable: function(e) {
            var distance = e.pageX - this.__drag.startX;
            
            if (this.__isRange) {
                if (this.__drag.el.hasClass('b-trackbar-handle-left')) {
                    this.setInstantValue([this.__toValue(
                        this.__drag.left + Math.abs(parseInt(this.__drag.el.css('marginLeft'), 10)) + distance
                    ), null]);
                }
                else {
                    this.setInstantValue([null, this.__toValue(this.__drag.left + distance)]);
                }
                
                if (this.__hasGraphState) {
                    this.__updateGraphState();
                }
            }
            else {
                this.setInstantValue(this.__toValue(this.__drag.left + 7 + distance));
            }
            
            return false;
        },
        
        /**
         *
         * @param e
         * @returns {boolean}
         * @private
         */
        __onDraggableStart: function(e) {
            var $this = $(e.currentTarget);
            this.__drag.el = $this;
            this.__drag.startX = e.pageX;
            this.__drag.left = $this.offset().left - $this.parent().offset().left;
            $(document).on(this.__drag);
            
            if (this.__isRange && this.__hasGraphState) {
                this.__toggleGraphState(true);
            }
            
            return false;
        },
        
        /**
         * @returns {boolean}
         * @private
         */
        __onDraggableStop: function() {
            $(document).off(this.__drag);
            this.setValue(this.getInstantValue());
            if (this.__hasGraphState) {
                this.__toggleGraphState(false);
            }
            return false;
        },
        
        /**
         * Отрисовка маркеров в html
         * @private
         */
        __renderMarkers: function() {
            var template = this.getElement().find('.b-trackbar-marker').remove().prop('outerHTML');
            this.__markers.forEach(function(marker) {
                var element = $(template);
                
                element.css({left: this.__fromPercent(marker.interval)})
                    .find('.b-trackbar-marker-value').text(marker.label ? marker.label : croc.utils.numFormat(marker.value));
                
                if (marker.label) {
                    element.addClass(
                        'b-trackbar-marker_' + marker.label.replace(/ /g, '').replace('>', 'gt').replace('<', 'lt')
                    );
                }
                
                this.__sliderContainer.append(element);
            }, this);
        },
        
        /**
         * @param range
         * @param [suggested=false]
         * @private
         */
        __setRangeBar: function(range, suggested) {
            if (!this.getElement()) {
                return;
            }
            
            var bar = suggested ? 'possible' : 'selected';
            var width = this.__toPixel(range[1]) - this.__toPixel(range[0])
            var left = this.__toPixel(range[0]);
            var deltaWidth = this.__barMinWidth[bar];
            var indentLeft = width === 0 ? 1 : 0;
            
            if (deltaWidth && width < deltaWidth) {
                left = left - (deltaWidth - Math.max(0, width)) / 2;
                width = deltaWidth;
                if (left + width > this.__width) {
                    left = this.__width - width;
                }
                if (left < 0) {
                    left = 0;
                }
            }
            
            this.getElement().find('.b-trackbar-range_' + bar).css({
                left: left,
                width: Math.max(0, width)
            });
            
            this.getElement().find('.b-trackbar-range_' + bar + '.g_left').css({
                left: 0 - indentLeft,
                width: Math.max(0, left)
            });
            
            this.getElement().find('.b-trackbar-range_' + bar + '.g_right').css({
                left: left + Math.max(0, width) + indentLeft,
                width: Math.max(0, this.__width - left - Math.max(0, width))
            });
        },
        
        /**
         * Перетаскивание ползунка
         * @private
         */
        __setUpDraggable: function() {
            this.__drag = {
                mouseup: this.__onDraggableStop.bind(this),
                mousemove: this.__onDraggable.bind(this)
            };
            
            this.getElement()
                .find('.b-trackbar-range-cnt').click(this.__onClickDraggable.bind(this))
                .end()
                .find('.b-trackbar-handle').mousedown(this.__onDraggableStart.bind(this)).click(function() {
                    return false;
                });
        },
        
        /**
         * Инициализируем основные элементы канваса и проставляем маркировку графа
         * @private
         */
        __setUpGraphData: function() {
            this.__canvas = this.getElement().find('canvas')[0];
            this.__canvasWidth = this.__canvas.width;
            this.__canvasHeight = this.__canvas.height;
            
            this.__rangeMin = this.getElement().find('.js-range-min');
            this.__rangeMax = this.getElement().find('.js-range-max');
            this.__rangeCount = this.getElement().find('.js-range-count');
            
            var graphAxisX = this.getElement().find('.js-graph-x');
            var graph = this.__graph;
            
            [graph['min'], graph.middle, graph['max']].forEach(function(value, i) {
                graphAxisX.eq(i).text(croc.utils.numFormat(value));
            });
        },
        
        __toggleGraphState: function(graph) {
            if (graph) {
                this.__updateGraphState();
            }
            this.getElement().toggleClass('state_graph', graph)
                .find('.js-trackbar-expanded').toggleClass('g-hidden', !graph);
        },
        
        /**
         * @private
         */
        __toPercent: function(value) {
            return this.__toPixel(value) / this.__width * 100;
        },
        
        /**
         * @private
         */
        __toPixel: function(value) {
            var $this = this;
            var y = value;
            if (y > this.__markers[this.__markers.length - 1].value) {
                y = this.__markers[this.__markers.length - 1].value;
            }
            if (y < this.__markers[0].value) {
                y = this.__markers[0].value;
            }
            
            var points = [];
            $.each(this.__markers, function(i) {
                if (i === 0) {
                    points[0] = 0;
                    return;
                }
                points[1] = i;
                if (y <= this.value) {
                    return false;
                }
                points[0] = i;
            });
            
            var y1 = this.__markers[points[0]].value, y2 = this.__markers[points[1]].value;
            var x1 = this.__markers[points[0]].interval, x2 = this.__markers[points[1]].interval;
            var k = (y2 - y1) / (x2 - x1);
            return this.__fromPercent(y / k - y2 / k + x2);
        },
        
        /**
         * @private
         */
        __toValue: function(pixel) {
            var $this = this;
            var x = this.__fromPixelToPercent(pixel);
            if (x > 100) {
                x = 100;
            }
            if (x < 0) {
                x = 0;
            }
            var points = [];
            $.each(this.__markers, function(i) {
                if (i === 0) {
                    points[0] = 0;
                    return;
                }
                points[1] = i;
                if (x <= this.interval) {
                    return false;
                }
                points[0] = i;
            });
            
            var y1 = this.__markers[points[0]].value, y2 = this.__markers[points[1]].value;
            var x1 = this.__markers[points[0]].interval, x2 = this.__markers[points[1]].interval;
            var r = this.__markers[points[0]].step;
            var k = (y2 - y1) / (x2 - x1);
            
            return Math.round((y2 - k * x2 + k * x) / r) * r;
        },
        
        /**
         * @private
         */
        __transformValue: function(value, old) {
            if (this.__isRange) {
                if (value === null) {
                    value = [this.__min, this.__max];
                }
                
                value = value.concat();
                if (value[0] === null) {
                    value[0] = old ? old[0] : this.__min;
                }
                if (value[1] === null) {
                    value[1] = old ? old[1] : this.__max;
                }
                
                if (isNaN(value[0])) {
                    value[0] = this.__min;
                }
                if (isNaN(value[1])) {
                    value[1] = this.__max;
                }
                
                value = value.map(function(r) {
                    return parseFloat(r);
                });
                
                if (old) {
                    if (old[0] === value[0] && value[0] > value[1]) {
                        value[0] = value[1];
                    }
                    if (old[1] === value[1] && value[0] > value[1]) {
                        value[1] = value[0];
                    }
                }
            }
            
            return value;
        },
        
        /**
         * @private
         */
        __updateGraphState: function() {
            var value = this.getInstantValue();
            this.__rangeMin.text(croc.utils.numFormat(value[0]));
            this.__rangeMax.text(croc.utils.numFormat(value[1]));
            
            // canvas
            var context = this.__canvas.getContext('2d');
            context.clearRect(0, 0, this.__canvasWidth, this.__canvasHeight);
            
            var min = Math.floor(this.__toPercent(value[0]) * this.__canvasWidth / 100);
            var max = Math.floor(this.__toPercent(value[1]) * this.__canvasWidth / 100);
            
            // draw range background
            this.__drawRect(min, 0, max - min, this.__canvasHeight, '#ceedff');
            
            // draw bars
            var x = 0;
            var w = croc.ui.form.field.TrackBar.__GRAPH_BAR_WIDTH;
            var h;
            var rangeCount = 0;
            this.__graph.data.forEach(function(bar) {
                h = Math.floor(bar.value * (this.__canvasHeight - 20) / 100);
                var isSelected = x + w > min && x < max;
                this.__drawRect(x, this.__canvasHeight - h, w, h, isSelected ? '#0073b8' : '#e6e6e6');
                x += w;
                if (isSelected) {
                    rangeCount += bar.count;
                }
            }, this);
            
            this.__rangeCount.text(croc.utils.numFormat(rangeCount) + ' ' +
            croc.utils.strInflect(rangeCount, 'товар', 'товара', 'товаров'));
        }
    }
});
