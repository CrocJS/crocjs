/**
 * api-ru Подсказки для поля ввода (могут работать и без него)
 * api-en Hints for input field (can work without it).
 * api-ru todo сделать $$label независимым от scope
 * api-en todo do $$label independent from scope.
 */
croc.Class.define('croc.cmp.list.Bubble', {
    extend: croc.cmp.Widget,
    implement: croc.cmp.common.bubble.IBubble,
    include: croc.cmp.common.bubble.MBubble,
    
    statics: {
        /**
         * api-ru Максимальное количество видимых одновременно элементов
         * api-en Maximum amount of visible items at the same time.
         * @type {number}
         */
        MAX_VISIBLE_ITEMS_COUNT: Stm.env.ldevice === 'mobile' ? 5 : 10,
        
        /**
         * api-ru Минимальное количество видимых одновременно элементов
         * api-en Minimum amount of visible items at the same time.
         * @type {number}
         */
        MIN_VISIBLE_ITEMS_COUNT: 3,
        
        /**
         * api-ru Коды ошибки сервера и сообщения к ним
         * api-en Server error codes and messages to them.
         * @private
         * @static
         */
        __ERROR_CODES: {
          11: 'По запросу <b>{query}</b> ничего не найдено'
          // api-ru
          // api-en 11: 'Request <b>{query}</b> not found.'
        },
        
        /**
         * @private
         * @static
         */
        __TEMPLATE_ITEM: '' +
        '<div class="b-suggestion-item{cls}" title="{title}">' +
        '   {text}' +
        '</div>'
    },
    
    events: {
        /**
         * @param item
         */
        itemClick: null
    },
    
    properties: {
        /**
         * api-ru Смещение по горизонтали относительно центра цели
         * api-en Horizontal offset relative to center of target.
         * @type {string}
         */
        hAlign: {
            inherit: true,
            value: 'left'
        },
        
        partialRendering: {},
        
        /**
         * api-ru Расположение относительно target
         * api-en Position relative to target.
         * @type {string}
         */
        position: {
            inherit: true,
            check: ['top', 'bottom'],
            value: 'bottom'
        },
        
        /**
         * api-ru Модификатор цвета
         * api-en Color modifier.
         * @type {string}
         */
        scheme: {
            type: 'string',
            model: true
        },
        
        /**
         * api-ru Размеры подсказок. Если подсказки ассоциируются с полем и они не имеют собственных размеров, то размеры подсказок становятся равными размерам поля.
         * api-en Prompts sizes. If prompts are associated with field and have no own sizes, prompts sizes become equal to field sizes.
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
         * api-ru Автоматическое позиционирование bubble исходя из положения на экране
         * api-en Bubble automatic positioning based on position on screen.
         * @type {boolean}
         */
        autoPositioning: true,
        
        /**
         * api-ru Порядок, в котором подбирается подходящая позиция при автопозиционировании
         * api-en Order, in which proper position is selected by automatic positioning.
         * @type {Array|Object}
         */
        autoPositioningSequence: ['top', 'bottom'],
        
        /**
         * api-ru Можно ли смещать элемент
         * api-en Can element be shift.
         * @type {boolean}
         */
        autoShift: false,
        
        /**
         * api-ru Флаг, закрывать ли bubble на клик по документу
         * api-en Flag, is bubble closed by click on document.
         * @type {boolean}
         */
        closeOnHtmlClick: true,
        
        /**
         * api-ru Флаг, позиционировать ли bubble при ресайзе/скролле
         * api-en Flag, is bubble positioning by resize/scroll. 
         * @type {boolean}
         */
        dynamicPositioning: true,
        
        items: {},
        
        labelItem: null,
        
        /**
         * api-ru модель данных для компонента
         * api-en Data model for component.
         * @type {Array|croc.data.chain.IList}
         */
        model: null,
        
        /**
         * @type {function(*):{text: ..., value: ...}}
         */
        normalizeFn: _.identity,
        
        /**
         * api-ru Смещение bubble относительно target
         * api-ru число - смещение по горизонтали/вертикали
         * api-ru массив - вектор смещения
         * api-en Bubble offset relative to target.
         * api-en Number - horizontal/vertical offset
         * api-en Array - offset vector.
         * @type {number}
         */
        offset: 2,
        
        scrollbarVisibility: {
            check: ['visible', 'hidden', 'abstract'],
            value: 'abstract'
        },
        
        /**
         * api-ru Нужно ли показывать строку с описанием ошибки при её возникновении
         * api-en To show string, which describes error when its occur.
         * @type {Boolean}
         */
        showError: false,
        
        visibleCount: 10,
        
        /**
         * api-ru Минимальное расстояние от края экрана до ближайшего края bubble при автопозиционировании
         * api-en Minimum distance from edge of screen to closest edge of bubble in the automatic positioning. 
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
         * api-ru Показать bubble. Если тултип был открыт, то возвращает true.
         * api-en Show bubble. If tooltip is open, then return true. 
         * @returns {boolean}
         */
        open: function() {
            if (!this.getDisableOpening() && this._isOpenAllowed()) {
                return croc.cmp.common.bubble.MBubble.prototype.open.apply(this, arguments);
            }
            return false;
        },
        
        /**
         * api-ru Инициализация модели виджета
         * api-en Initialization of widget model.
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
