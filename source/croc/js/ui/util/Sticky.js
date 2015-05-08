croc.ns('croc.ui.util');

croc.ui.util.Sticky = croc.extend(croc.Object, {
    
    /**
     * Автоматическое определение ширины fixed элемента
     * @type {Boolean}
     */
    autoWidth: true,
    
    /**
     * Нижняя граница фиксированного элемента
     * @type {Function|jQuery|Number}
     */
    bottomBound: null,
    
    /**
     * @type {String}
     */
    className: 'state_fixed',
    
    /**
     * @type {Boolean}
     */
    disabled: false,
    
    /**
     * @type {jQuery}
     */
    el: null,
    
    /**
     * Проблема с z-index в опере
     * @type {boolean}
     */
    operaFix: false,
    
    /**
     * Преждевременный переход в "sticky" состояние, т.е. до того, как скролл дошел до элемента.
     * @type {Number}
     */
    topBefore: 0,
    
    /**
     * Отступ сверху при state_fixed
     * @type {Number}
     */
    topSpacing: 20,
    
    /**
     * Получить нижнюю допустимую грань
     * @returns {number}
     */
    getBottomBoundOffset: function() {
        switch ($.type(this.bottomBound)) {
            case 'function':
                return this.bottomBound.call(this);
                break;
            case 'number':
                return this.bottomBound;
                break;
            case 'object':
                return this.bottomBound.offset().top + this.bottomBound.outerHeight();
                break;
            default:
                return 0;
        }
    },
    
    init: function() {
        if (!this.el || this.el.length === 0) {
            throw new Error('Не передан элемент');
        }
        
        this.__placeholder = null;
        this.__sticked = false;
        
        var self = this;
        this.__scrollFn = function() {
            self.__onScroll();
        };
        
        this.setDisabled(this.disabled);
        this.__onScroll();
    },
    
    /**
     * @returns {boolean}
     */
    isSticked: function() {
        return this.__sticked;
    },
    
    /**
     * Вернуть элемент в дефолтное состояние
     */
    setDefaultState: function() {
        if (this.__placeholder) {
            this.__placeholder.remove();
            this.__placeholder = null;
        }
        
        var cfg = {
            position: '',
            width: ''
        };
        
        if (parseInt(this.el.css('top'), 10) <= this.topSpacing) {
            cfg.top = '';
        }
        
        cfg.zIndex = !this.__originalZIndex || this.operaFix ? '' : this.__originalZIndex;
        
        this.el.removeClass(this.className).css(cfg);
        this.__sticked = false;
    },
    
    /**
     * @type {Boolean}
     */
    setDisabled: function(value) {
        if (this.__scrollingListener) {
            this.__scrollingListener.remove();
            this.__scrollingListener = null;
        }
        
        if (value) {
            this.disabled = true;
            this.setDefaultState();
        }
        else {
            this.__scrollingListener = this._getDisposer().addListener($(window), 'scroll', this.__scrollFn);
            this.disabled = false;
        }
    },
    
    update: function() {
        this.__onScroll();
    },
    
    /**
     * @private
     */
    __getFixedOffsetTop: function() {
        var bottomBoundOffset = this.getBottomBoundOffset();
        var top = 0;
        
        if (bottomBoundOffset) {
            top = bottomBoundOffset - ($(window).scrollTop() + this.topSpacing + this.el.outerHeight(true));
        }
        
        // if top < 0 is bottom
        return (top < 0 ? top : 0) + this.topSpacing;
    },
    
    __onScroll: function() {
        if (!this.el.is(':visible')) {
            return;
        }
        
        var placeholder = this.__placeholder ? this.__placeholder : this.el;
        
        if ($(window).scrollTop() > placeholder.offset().top - this.topSpacing - this.topBefore) {
            var cssCfg = {
                position: 'fixed',
                top: this.__getFixedOffsetTop()
            };
            
            if (!this.__sticked) {
                if (this.operaFix) {
                    cssCfg.zIndex = this.el.css('zIndex') === 'auto' ? 0 : '';
                }
                else {
                    this.__originalZIndex = _.parseInt(this.el.css('zIndex'));
                    if (isNaN(this.__originalZIndex)) {
                        this.__originalZIndex = undefined;
                    }
                    cssCfg.zIndex = croc.utils.getZIndex('fixed');
                }
            }
            
            if (!this.__placeholder) {
                this.__placeholder = $('<div></div>').css({
                    width: this.el.outerWidth(),
                    height: this.el.outerHeight(),
                    margin: this.el.css('margin'),
                    position: this.el.css('position'),
                    display: this.el.css('display'),
                    visibility: 'hidden'
                }).insertBefore(this.el);
            }
            
            if (this.autoWidth) {
                cssCfg.width = placeholder.width();
            }
            
            this.el.css(cssCfg).addClass(this.className);
            this.__sticked = true;
            
            this.fireEvent('fixedScroll');
        }
        else {
            this.setDefaultState();
        }
        
    }
    
});