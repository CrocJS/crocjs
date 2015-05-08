croc.ns('croc.util');

croc.util.WidthQuery = croc.extend(croc.Object, {
    
    /**
     * @param size {Object|Array} Правила
     */
    size: undefined,
    
    /**
     * @private
     * @param currentRule {Number} Номер текущего правила
     */
    _currentRule: undefined,
    
    /**
     * @private
     * @param currentWidth {Number} Текущая ширина прослушиваемого элемента
     */
    _currentWidth: null,
    
    init: function() {
    
        if (!this.el || !this.size) {
            return;
        }
        
        var self = this;
        
        $(window).on('resize', _.debounce(function() {
            if (!self.__disabled) {
                self._checkWidthChange();
            }
        }, 50));
        
        this._checkWidthChange();
    },
    
    getCurrentRule: function() {
        return this._currentRule;
    },
    
    /**
     * @param {Boolean} value
     */
    setDisabled: function(value) {
        this.__disabled = value;
    },
    
    /**
     * @private
     * Прослушивание изменения ширины элемента на ресайз окна
     */
    _checkWidthChange: function() {
        var rules = _.isPlainObject(this.size) ? [this.size] : this.size,
            width = this.el.outerWidth(),
            rule = -1;
        
        for (var i = 0, len = rules.length; i < len; i++) {
            if (rules[i].min <= width && width <= rules[i].max) {
                rule = i;
                break;
            }
        }
        
        var oldWidth = this._currentWidth;
        this._currentWidth = width;
        if (this._currentRule !== rule) {
            this._currentRule = rule;
            this.fireEvent('change', this, rule, width, oldWidth);
        }
    }
    
});