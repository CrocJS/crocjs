/**
 * Подсказки для поля ввода (могут работать и без него)
 * todo сделать $$label независимым от scope
 */
croc.Class.define('croc.cmp.list.Bubble', {
    extend: croc.cmp.Widget,
    implement: croc.cmp.common.bubble.IBubble,
    include: croc.cmp.common.bubble.MBubble,
    
    statics: {
        /**
         * Максимальное количество видимых одновременно элементов
         * @type {number}
         */
        MAX_VISIBLE_ITEMS_COUNT: Stm.env.ldevice === 'mobile' ? 5 : 10,
        
        /**
         * Минимальное количество видимых одновременно элементов
         * @type {number}
         */
        MIN_VISIBLE_ITEMS_COUNT: 3
    },
    
    events: {
        /**
         * @param item
         */
        itemClick: null
    },
    
    properties: {
        /**
         * Смещение по горизонтали относительно центра цели
         * @type {string}
         */
        hAlign: {
            inherit: true,
            value: 'left'
        },
        
        partialRendering: {},
        
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: {
            inherit: true,
            check: ['top', 'bottom'],
            value: 'bottom'
        },
        
        /**
         * Модификатор цвета
         * @type {string}
         */
        scheme: {
            type: 'string',
            model: true
        },
        
        /**
         * Размеры подсказок. Если подсказки ассоциируются с полем и они не имеют собственных размеров, то размеры подсказок
         * становятся равными размерам поля.
         * @type {string}
         */
        size: {
            type: 'string',
            model: true
        },
        
        toggleByModel: {
            value: false,
            model: true
        }
    },
    
    options: {
        /**
         * Автоматическое позиционирование bubble исходя из положения на экране
         * @type {boolean}
         */
        autoPositioning: true,
        
        /**
         * Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * @type {Array|Object}
         */
        autoPositioningSequence: ['top', 'bottom'],
        
        /**
         * Можно ли смещать элемент
         * @type {boolean}
         */
        autoShift: false,
        
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
        
        items: {},
        
        labelItem: null,
        
        /**
         * модель данных для компонента
         * @type {Array|croc.data.chain.IList}
         */
        model: null,
        
        /**
         * @type {function(*):{text: ..., value: ...}}
         */
        normalizeFn: _.identity,
        
        /**
         * Смещение bubble относительно target
         * число - смещение по горизонтали/вертикали
         * массив - вектор смещения
         * @type {number}
         */
        offset: 2,
        
        scrollbarVisibility: {
            check: ['visible', 'hidden', 'abstract'],
            value: 'abstract'
        },
        
        /**
         * Нужно ли показывать строку с описанием ошибки при её возникновении
         * @type {Boolean}
         */
        showError: false,
        
        visibleCount: 10,
        
        /**
         * Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * @type {Array.<number>}
         */
        screenGap: [5, 5, 5, 5],
        
        _managerAddConf: {
            extend: true
        }
    },
    
    members: {
        /**
         * @returns {croc.cmp.list.manager.Scrolling}
         */
        getListManager: function() {
            return this.__manager;
        },
        
        /**
         * @returns {croc.data.chain.IList}
         */
        getModel: function() {
            return this.__model;
        },
        
        normalizeItem: function(item) {
            return this._options.normalizeFn(item);
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.list.Bubble.superclass._initModel.apply(this, arguments);
            
            var modelFromItems = this._options.fromItems = !this._options.model;
            this.__manager = new croc.cmp.list.manager.Scrolling(_.assign({
                model: this._model.at(modelFromItems ? 'items' : 'model'),
                visibleCount: this._options.visibleCount,
                buffer: this._options.visibleCount,
                partialRendering: this._options.partialRendering,
                scrollbarVisibility: this._options.scrollbarVisibility,
                hasOverflowMarkers: this._options.scrollbarVisibility !== 'visible',
                hideOverflowMarkers: true,
                itemsSelector: '.b-suggestion-item'
            }, this._options._managerAddConf));
            this.__model = this.__manager.getRendererModel();
            if (!modelFromItems) {
                this.__model.refTo(this._model.at('items'));
            }
            
            this.__model.on('change', this.debounce(function(items) {
                if (this.getToggleByModel()) {
                    if (items.length > 0) {
                        this.open();
                    }
                    else if (!this._isOpenAllowed()) {
                        this.close();
                    }
                }
                this.reposition();
            }, this));
        },
        
        /**
         * @returns {boolean}
         * @protected
         */
        _isOpenAllowed: function() {
            return this.__model.getLength() > 0;
        },
        
        /**
         * @private
         */
        __setUpOverflowing: function() {
            if (!this.getVisibleItemsManager()) {
                return;
            }
            
            this.on('beforePositionApply', function(css, jointCss, prevent) {
                var firstItem = this.getListItemElement(0);
                if (!firstItem) {
                    return;
                }
                
                var manager = this.getVisibleItemsManager();
                var windowEl = $(window);
                var itemHeight = firstItem.outerHeight(true);
                
                if (typeof this.__screenGap === 'function') {
                    this.__screenGap = this.__screenGap(this);
                }
                
                var visibleHeight = this.getCurrentPosition() === 'bottom' ?
                windowEl.scrollTop() + windowEl.height() - css.top - this.__screenGap[2] :
                css.top + this.getElement().height() - windowEl.scrollTop() - this.__screenGap[0];
                
                var visibleCount = croc.utils.numToRange(Math.floor(visibleHeight / itemHeight),
                    croc.cmp.list.Bubble.MIN_VISIBLE_ITEMS_COUNT,
                    croc.cmp.list.Bubble.MAX_VISIBLE_ITEMS_COUNT);
                var lastVisibleCount = manager.getVisibleItemsCount();
                
                manager.setVisibleItemsCount(visibleCount);
                if (lastVisibleCount !== visibleCount) {
                    prevent();
                    this.reposition();
                }
            }, this);
        }
    }
});
