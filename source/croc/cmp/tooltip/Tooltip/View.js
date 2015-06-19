croc.View.define('croc.cmp.tooltip.Tooltip.View', {
    include: croc.cmp.common.bubble.MBubbleTrigger.View,
    
    members: {
        /**
         * Возвращает элемент точки крепления. Например, стрелка тултипа.
         * @returns {jQuery}
         */
        getJointEl: function() {
            return this.__jointEl || (this.__jointEl = $(this.triElement));
        },
        
        /**
         * Элемент отвечающий за размеры bubble
         * @returns {jQuery}
         */
        getSizeableElement: function() {
            return $(this.bodyElement);
        }
    }
});