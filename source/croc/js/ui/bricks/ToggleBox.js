croc.ns('croc.ui.bricks');

/**
 * ToggleBox. Может работать с любой разметкой.
 * @extends {croc.Object}
 * @example
 * <div class="b-togglebox{cls} {openClose}">
 *   <div class="b-togglebox-header">
 *       <span class="b-togglebox-header-link g-link b-pseudolink"><span class="b-togglebox-header-link-icon"></span><span class="b-pseudolink-h">
 *           {header}
 *       </span></span>
 *   </div>
 *   <div class="b-togglebox-content">{content}</div>
 * </div>
 * @event beforeChangeOpen (value: {boolean})
 * @event changeOpen (value: {boolean})
 */
croc.ui.bricks.ToggleBox = croc.extend(croc.Object, {
    
    DEFAULT_ANIMATION_TIME: 300,
    
    /**
     * @type {boolean}
     */
    animate: false,
    
    /**
     * При назначении автоматически выставляет {@link #animate} в true
     * @type {string}
     */
    animateElSelector: null,
    
    /**
     * @type {number}
     */
    animateMinHeight: 0,
    
    /**
     * @type {string}
     */
    contentSelector: null,
    
    /**
     * @type {string}
     */
    closedClass: null,
    
    /**
     * Элемент для togglebox
     * @type {jQuery}
     */
    el: null,
    
    /**
     * @type {function(jQuery):number}
     */
    heightFn: function(el) { return el[0].scrollHeight; },
    
    /**
     * @type {string}
     */
    iconClosedClass: null,
    
    /**
     * @type {string}
     */
    iconOpenClass: null,
    
    /**
     * @type {string}
     */
    iconSelector: null,
    
    /**
     * @type {boolean}
     */
    open: null,
    
    /**
     * @type {string}
     */
    openClass: 'state_open',
    
    /**
     * Возбуждать событие appear на показанных виджетах
     * @type {boolean}
     */
    propagateAppear: false,
    
    /**
     * @type {string}
     */
    toggleLinkSelector: '.b-togglebox-header-link:eq(0)',
    
    init: function() {
        croc.ui.bricks.ToggleBox.superclass.init.apply(this, arguments);
        
        this.contentEl = this.contentSelector ? this.el.find(this.contentSelector) : this.el;
        
        if (this.animateElSelector) {
            this.animate = true;
        }
        
        this.open = this.openClass ?
            this.contentEl.hasClass(this.openClass) :
            !this.contentEl.hasClass(this.closedClass);
        
        if (this.animate) {
            this.__animateElement = this.animateElSelector || this.contentSelector ?
                this.el.find(this.animateElSelector || this.contentSelector) : this.el;
        }
        
        if (this.iconSelector) {
            this.__iconElement = this.el.find(this.iconSelector);
        }
        
        this.el.find(this.toggleLinkSelector).click(function() {
            this.toggleOpen();
        }.bind(this));
    },
    
    /**
     * DOM-Элемент
     * @returns {jQuery}
     */
    getElement: function() {
        return this.el;
    },
    
    /**
     * @returns {boolean}
     */
    getOpen: function() {
        return this.open;
    },
    
    /**
     * @param {boolean} value
     */
    setOpen: function(value) {
        value = !!value;
        
        if (this.open !== value) {
            this.fireEvent('beforeChangeOpen', value);
        }
        
        if (this.__animateElement) {
            this.__animateElement.stop(true).animate({
                height: value ? this.heightFn(this.__animateElement) : this.animateMinHeight
            }, this.DEFAULT_ANIMATION_TIME, function() {
                if (value) {
                    this.__animateElement.css('height', 'auto');
                }
            }.bind(this));
        }
        
        if (this.openClass) {
            this.contentEl.toggleClass(this.openClass, value);
        }
        if (this.closedClass) {
            this.contentEl.toggleClass(this.closedClass, !value);
        }
        
        if (this.__iconElement) {
            if (this.iconOpenClass) {
                this.__iconElement.toggleClass(this.iconOpenClass, value);
            }
            if (this.iconClosedClass) {
                this.__iconElement.toggleClass(this.iconClosedClass, !value);
            }
        }
        
        if (this.open !== value) {
            this.open = value;
            this.fireEvent('changeOpen', value);
        }
        
        if (this.open && this.propagateAppear) {
            croc.utils.domPropagateAppear(this.el);
        }
    },
    
    toggleOpen: function() {
        this.setOpen(!this.getOpen());
    }
});

croc.ui.WidgetsManager.getInstance().registerAlias(croc.ui.bricks.ToggleBox, 'croc.ui.bricks.ToggleBox');