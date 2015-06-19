croc.Mixin.define('croc.cmp.common.bubble.MBubbleTrigger.View', {
    extend: croc.cmp.common.bubble.MBubble.View,
    
    members: {
        /**
         * Возвращает коллекцию элементов, к которым в данный момент прикреплён bubble
         * @returns {jQuery}
         */
        getHostElements: function() {
            var curTarget = this._widget.getCurrentTarget();
            return curTarget && curTarget instanceof jQuery ? curTarget : this._widget.getTrigger() || null;
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         */
        isClosingOnHtmlClickAllowed: function(targetEl) {
            return croc.cmp.common.bubble.MBubble.View.prototype.isClosingOnHtmlClickAllowed.apply(this, arguments) &&
                (!this._data.currentTrigger || !targetEl.closest(this._data.currentTrigger).length);
        }
    }
});
