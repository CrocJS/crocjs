/**
 * Сервис открытия глобальных попапов
 */
croc.Class.define('croc.services.Popup', {
    extend: croc.Object,
    
    events: {
        /**
         * @param {string} type
         */
        close: null,
        
        /**
         * @param {string} type
         */
        open: null,
        
        /**
         * @param {string} type
         * @param {function} prevent
         */
        tryClose: null,
        
        /**
         * @param {string} type
         * @param {function} prevent
         */
        tryOpen: null
    },
    
    construct: function(options) {
        this.__popups = {};
        this.__popupManager = croc.ui.common.bubble.Manager.getInstance('popup');
        
        croc.services.Popup.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Закрыть попап переданного типа
         * @param {string} type
         */
        close: function(type) {
            var popup = this.__popups[type];
            if (popup) {
                var closingAllowed = true;
                this.fireEvent('tryClose', type, function() { closingAllowed = false; });
                
                if (closingAllowed) {
                    popup.close();
                }
            }
        },
        
        /**
         * Открыть попап переданного типа
         * @param {string|Function} type
         * @param {Object} [config]
         * @return {boolean}
         */
        open: function(type, config) {
            var Cls;
            if (typeof type === 'string') {
                Cls = croc.Class.getClass(type);
            }
            else {
                Cls = type;
                type = Cls.classname;
            }
            
            if (!this.__popups[type]) {
                var openingAllowed = true;
                this.fireEvent('tryOpen', type, function() { openingAllowed = false; });
                
                if (!openingAllowed) {
                    return false;
                }
                
                var popup = this.__popups[type] = new Cls(config);
                popup.on({
                    open: function() {
                        this.fireEvent('open', type);
                    }.bind(this),
                    changeOpen: croc.utils.fnRetentiveBind(function(popup, open) {
                        if (!open) {
                            if (!this.__popupManager.isInStack(popup)) {
                                this.__popups[type] = null;
                            }
                            this.fireEvent('close', type);
                        }
                    }, this)
                });
                popup.open();
                
                return true;
            }
            return false;
        },
        
        /**
         * Открыть/закрыть попап в зависимости от параметра value
         * @param {string} type
         * @param {boolean} value
         */
        toggle: function(type, value) {
            if (value) {
                this.open(type);
            }
            else {
                this.close(type);
            }
        }
    }
});