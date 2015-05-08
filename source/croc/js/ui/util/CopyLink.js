//+use swfobject
//+use $.zclip

/**
 * Кнопка для копирования текста в буфер обмена.
 */
croc.Class.define('croc.ui.util.CopyLink', {
    extend: croc.Object,
    
    events: {
        copied: null
    },
    
    properties: {
        /**
         * Активна ли кнопка
         */
        active: {
            type: 'boolean',
            value: true,
            apply: '__applyActive',
            option: true
        }
    },
    
    options: {
        /**
         * Класс добавляется к оригинальному элементу по зажатию кнопки
         * @type {string}
         */
        activeCls: 'state_active',
        
        /**
         * Текст или функция, возвращающая текст для копирования
         * @type {function():string|string}
         */
        copyText: {
            type: ['function', 'string'],
            required: true
        },
        
        /**
         * Элемент, на который накладывается кнопка
         * @type {jQuery|Element|string}
         */
        el: null,
        
        /**
         * Класс добавляется к оригинальному элементу при наведении курсора на кнопку
         * @type {string}
         */
        hoverCls: 'state_hover',
        
        /**
         * Текст уведомления (либо функция возвращающая текст) после копирования
         * @type {function():string|string}
         */
        notification: {
            type: ['function', 'string']
        },
        
        /**
         * Подсказка для кнопки
         * @type {string}
         */
        title: {
            type: 'string'
        },
        
        /**
         * Виджет, на который накладывается кнопка
         * @type {croc.ui.Widget}
         */
        widget: {}
    },
    
    construct: function(options) {
        this.__allowed = swfobject.getFlashPlayerVersion().major >= 9;
        if (!this.__allowed) {
            return;
        }
        
        this.__el = options.el;
        this.__widget = options.widget;
        this.__title = options.title;
        
        this.__config = {
            activeCls: options.activeCls,
            hoverCls: options.hoverCls,
            copy: function() {
                return _.result(options, 'copyText');
            },
            afterCopy: function() {
                this.fireEvent('copied');
                if (options.notification) {
                    croc.ui.notifications.Manager.showNotification(_.result(options, 'notification'));
                }
            }.bind(this)
        };
        
        if (!this.__el && this.__widget) {
            if (this.__widget.getRendered()) {
                this.__el = this.__widget.getElement();
            }
            else {
                this._getDisposer().addListener(this.__widget, 'changeRendered', function() {
                    this.__el = this.__widget.getElement();
                    if (this.getActive()) {
                        this.__applyActive(true);
                    }
                }, this);
            }
        }
        
        if (options.active) {
            this.__applyActive(true);
        }
    },
    
    destruct: function() {
        this.setActive(false);
    },
    
    members: {
        /**
         * Контейнер флеш-кнопки, который накладывается на элемент
         * @returns {jQuery}
         */
        getOverlayElement: function() {
            return this.__el && $('#' + this.__el.data('zclipId'));
        },
        
        /**
         * Отрисована ли кнопка в данный момент
         * @returns {boolean}
         */
        isRendered: function() {
            return !!this.__isRendered;
        },
        
        /**
         * Перерисовать кнопку
         */
        rerender: function() {
            this.setActive(false);
            this.setActive(true);
        },
        
        /**
         * @param value
         * @private
         */
        __applyActive: function(value) {
            if (!this.__allowed) {
                return;
            }
            
            if (this.__appearListener) {
                this.__appearListener.remove();
            }
            
            if (!value) {
                if (this.__el) {
                    this.__el.zclip('hide');
                }
            }
            else if (this.__el) {
                if (this.__el.is(':visible')) {
                    this.__render();
                }
                else {
                    var widget = croc.ui.Widget.getClosestWidget(this.__el);
                    if (widget && !widget.isVisible()) {
                        this.__appearListener = this._getDisposer().addListener(widget, 'appear', function() {
                            this.__appearListener.remove();
                            this.__render();
                        }, this);
                    }
                }
            }
        },
        
        /**
         * @private
         */
        __render: function() {
            if (this.__isRendered) {
                this.__el.zclip('show');
            }
            else {
                this.__el.zclip(this.__config);
                this.__isRendered = true;
                if (this.__title) {
                    this.getOverlayElement().attr('title', this.__title);
                }
            }
        }
    }
});