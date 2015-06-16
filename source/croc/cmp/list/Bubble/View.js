croc.View.define('croc.cmp.list.Bubble.View', {
    include: croc.cmp.common.bubble.MBubble.View,
    members: {
        initList: function(el) {
            this._widget.getListManager().initContainer($(el));
        },
        
        onClick: function(item) {
            this._widget.fireEvent('itemClick', item);
        }
    }
});
