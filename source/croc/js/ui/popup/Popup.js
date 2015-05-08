//+follow croc.ui.popup.popupManager

/**
 * Попап
 * todo нужно событие для полного закрытия попапа (потеря менеджером попапов)
 */
croc.Class.define('croc.ui.popup.Popup', {
    extend: croc.ui.Container,
    implement: croc.ui.common.bubble.IBubble,
    include: croc.ui.common.bubble.MBubble,
    
    events: {
        /**
         * Была нажата кнопка "назад"
         */
        'back': null
    },
    
    properties: {
        /**
         * попап в режиме загрузки
         */
        loadingState: {
            cssClass: 'state_loading',
            type: 'boolean',
            value: false,
            option: true,
            event: true
        },
        
        /**
         * Цветовая схема
         * @type {string}
         */
        scheme: {
            cssClass: true,
            type: 'string',
            value: 'default',
            event: true,
            option: true
        },
        
        /**
         * Отбрасывает ли попап тень
         * @type {boolean}
         */
        shadow: {
            cssClass: 'shadow',
            type: 'boolean',
            value: true,
            option: true
        },
        
        /**
         * Скин
         * @type {string}
         */
        skin: {
            cssClass: true,
            type: 'string',
            value: 'default',
            option: true
        },
        
        /**
         * Заголовок попапа
         * @type {string}
         */
        title: {
            type: 'string',
            apply: function(value) {
                if (this.getElement()) {
                    this.getElement().find('.js-popup-title').html(value);
                }
            },
            option: true
        }
    },
    
    options: {
        /**
         * Таймаут через который должен быть закрыт bubble
         * @type {number}
         */
        autoCloseTimeout: 3000,
        
        /**
         * Отличие от размера target, зазор между краем target и краем bubble
         */
        autoSizeGap: 30,
        
        /**
         * Кнопка "назад" в заголовке
         * @type {boolean}
         */
        backButton: false,
        
        /**
         * Содержимое попапа
         * @type {string}
         */
        content: null,
        
        /**
         * Файл шаблона содержимого попапа
         * @type {string}
         */
        contentTemplate: null,
        
        /**
         * Есть ли возможность закрыть попап
         * @type {boolean}
         */
        closeable: true,
        
        /**
         * Дополнительный класс для кнопки закрытия
         * @type {string}
         */
        closeButtonCls: Stm.env.ldevice === 'mobile' ? 'scheme_gray' : null,
        
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
         * Содержимое футера попапа
         * @type {string}
         */
        footerContent: null,
        
        /**
         * Попап должен растягиваться на весь экран (только при overlay=true)
         * @type {boolean}
         */
        fullscreen: false,
        
        /**
         * Шаблон заголовка попапа
         * @type {string}
         */
        headTemplate: '<div class="b-popup-head-h"><div class="b-popup-head-title js-popup-title">{title}</div></div>',
        
        /**
         * Анимация сокрытия
         * @see #showAnimation
         * @type {string}
         */
        hideAnimation: Stm.env.ldevice === 'mobile' ? 'slide' : 'fade',
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<div class="b-popup{cls}">' +
        '   <div class="b-popup-h">' +
        '       <div class="b-popup-close {closeButtonCls} js-bubble-close"></div>' +
        '       <div class="b-popup-head js-popup-head">' +
        '           {head}' +
        '           {backButton}' +
        '       </div>' +
        '       <div class="b-popup-body">' +
        '           <div class="b-popup-body-h js-popup-body">{items}</div>' +
        '       </div>' +
        '       {footer}' +
        '   </div>' +
        '</div>',
        
        /**
         * Менеджер всплывающих элементов (или его имя), который будет отвечать за данный
         * @type {string|croc.ui.common.bubble.Manager}
         */
        manager: 'popup',
        
        /**
         * Подложка для попапа
         * @type {boolean}
         */
        overlay: true,
        
        /**
         * Расположение относительно target
         * @type {string}
         */
        position: 'center',
        
        /**
         * Анимация всплывания
         * @type {string}
         */
        showAnimation: Stm.env.ldevice === 'mobile' ? 'slide' : 'fade',
        
        /**
         * Объект крепления bubble. Может быть коллекцией dom-элементов, виджетом, точкой на экране (массив [x, y]),
         * прямоугольником (массив [[x1, y1], [x2, y2]]), функция - которая возвращает значение одного из предыдущих
         * типов
         * @type {jQuery|croc.ui.Widget|Array|function}
         */
        target: {
            value: croc.isClient && $(window)
        },
        
        /**
         * По-умолчанию ставить zIndex верхнего слоя
         * @type {boolean}
         */
        _upperZIndexLayer: true
    },
    
    construct: function(options) {
        croc.ui.popup.Popup.superclass.__construct__.apply(this, arguments);
        
        if (Stm.env.ldevice === 'mobile') {
            options.customReposition = function($this, bubbleCss, jointCss) {
                bubbleCss.top = 0;
            };
        }
    },
    
    members: {
        /**
         * Does popup fit full screen
         * @returns {boolean}
         */
        isFullscreen: function() {
            return this._options.fullscreen;
        },
        
        /**
         * Есть ли у попапа оверлэй
         * @returns {boolean}
         */
        isWithOverlay: function() {
            return this.__overlay;
        },
        
        /**
         * Элемент, содержащий контент попапа
         * @returns {jQuery}
         */
        getBodyElement: function() {
            return this.__bodyElement || (this.__bodyElement = this.getElement().find('.js-popup-body'));
        },
        
        /**
         * Есть ли кнопка "назад" у попапа
         * @returns {boolean}
         */
        hasBackButton: function() {
            return this.__backButton;
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.popup.Popup.superclass._getAddRenderData.apply(this, arguments), {
                backButton: !options.backButton ? '' :
                    '<div class="b-popup-button mod_back role_head js-popup-back"></div>',
                head: options.headTemplate.render({title: this.getTitle() || ''}),
                items: options.content || null,
                footer: !options.footerContent ? '' :
                '<div class="b-popup-foot"><div class="b-popup-foot-h">' + options.footerContent + '</div></div>',
                closeButtonCls: !options.closeable ? 'g-hidden' : options.closeButtonCls || ''
            });
        },
        
        /**
         * Шаблон для элемента
         * @param {Object} options
         * @return {$.Deferred|string}
         * @protected
         */
        _getTemplate: function(options) {
            if (options.contentTemplate) {
                return this._requestTemplate(options.contentTemplate, function(tpl) {
                    return options.htmlTemplate.render({items: tpl});
                });
            }
            return options.htmlTemplate;
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.popup.Popup.superclass._initWidget.apply(this, arguments);
            
            var closeButtonEl = this.getElement().find('.b-popup-close');
            if (!croc.utils.domGetModifier(closeButtonEl, 'scheme')) {
                this.listenProperty('scheme', function(scheme) {
                    croc.utils.domSetModifier(closeButtonEl, 'scheme', scheme);
                });
            }
            
            this.getElement().on('click', '.js-popup-back', function() {
                this.fireEvent('back');
            }.bind(this));
            
            if (Stm.env.ldevice === 'mobile') {
                this.__setUpMobile();
            }
            
            this.on('changeLoadingState', function() {
                this.reposition();
            }, this);
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            if (options.fullscreen && !options.overlay) {
                throw new Error('fullscreen в данный момент возможен только при overlay=true');
            }
            
            if (options.overlay) {
                options.wrapperTemplate = '' +
                '<div class="b-overlay view_' + (options.fullscreen ? 'fullscreen' : 'default') + ' js-wrapper">' +
                '   <div class="b-overlay-h">{item}</div>' +
                '</div>';
                
                options._skipElementLeft = true;
                if (options.fullscreen) {
                    options._skipElementTop = true;
                }
            }
            else if (options.fullscreen) {
                options.autoSize = true;
            }
            
            this.__overlay = options.overlay;
            this.__backButton = options.backButton;
            
            if (!options.closeable) {
                options.closeOnHtmlClick = false;
                options.closeOnResize = false;
                options.closeOnScroll = false;
            }
    
            if (Stm.env.ldevice === 'mobile') {
                if (options.overlay) {
                    options.showAnimationDelay = 100;
                }
                if (options.scheme === 'gray') {
                    this.setScheme('default');
                }
            }
            
            croc.ui.common.bubble.MBubble.prototype._onPropertiesInitialized.apply(this, arguments);
            croc.ui.popup.Popup.superclass._onPropertiesInitialized.apply(this, arguments);
        },
        
        /**
         * Изменить элемент ещё не вставленный в DOM корневой элемент
         * @param {jQuery} el
         * @protected
         */
        _transformElement: function(el) {
            croc.ui.popup.Popup.superclass._transformElement.apply(this, arguments);
            if (!this.getTitle()) {
                el.find('.b-popup-head').remove();
            }
        },
        
        /**
         * @private
         */
        __setUpMobile: function() {
            var scrollable = this.getElement().find('.js-popup-body').addClass('g-scrollable-h');
            scrollable.parent().addClass('g-scrollable');
            croc.util.Mobile.scrollFix(scrollable);
            
            var onResize = function() {
                scrollable.css('maxHeight',
                    this.getWrapperElement().outerHeight() - this.getElement().find('.js-popup-head').height());
            }.bind(this);
            this.on('open', onResize);
            this._getDisposer().addListener($(window), 'resize', onResize);
        }
    }
});
