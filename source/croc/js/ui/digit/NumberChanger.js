croc.ns('croc.ui.digit');

/**
 * Цифры внутри виджета изменяются перебором. Инициализируется только из разметки.
 * @extends {croc.ui.Widget}
 */
croc.ui.digit.NumberChanger = croc.extend(croc.ui.Widget, {
    
    /**
     * @type {number}
     */
    duration: 500,
    
    /**
     * @type {string|Function}
     */
    easing: 'easeInExpo',
    
    /**
     * @type {boolean}
     */
    formatThousands: false,
    
    init: function() {
        croc.ui.digit.NumberChanger.superclass.init.call(this);
        this.__version = 0;
    },
    
    /**
     * @param {number} number
     */
    setNumber: function(number) {
        if (!this.getElement()) {
            return;
        }
        
        var version = ++this.__version;
        $({number: this.__number}).animate({number: number}, {
            step: function(val) {
                if (this.__version !== version) {
                    return;
                }
                this.__number = val = Math.floor(val);
                if (this.formatThousands) {
                    val = croc.utils.numFormat(val);
                }
                this.getElement().text(val);
            }.bind(this),
            easing: this.easing,
            duration: this.duration
        });
    },
    
    /**
     * Инициализация виджета после его отрисовки в DOM
     * @return {$.Deferred|undefined}
     * @protected
     */
    _initWidget: function() {
        croc.ui.digit.NumberChanger.superclass._initWidget.call(this);
        
        this.__number = parseInt(this.getElement().text().replace(/ /g, ' ') || '0', 10);
    }
});

croc.ui.WidgetsManager.getInstance().registerAlias(croc.ui.digit.NumberChanger, 'croc.ui.digit.NumberChanger');