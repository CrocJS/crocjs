croc.Class.define('croc.cmp.list.Menu', {
    extend: croc.cmp.list.Bubble,
    
    options: {
        /**
         * Флаг, закрывать ли bubble при скролле
         * @type {boolean}
         */
        closeOnScroll: true,
        
        scrollbarVisibility: 'hidden'
    },
    
    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @protected
         */
        _initWidget: function() {
            croc.cmp.list.Menu.superclass._initWidget.apply(this, arguments);
            
            this.on('changeRendered', function() {
                var target = this.getTarget();
                if (target && (target instanceof jQuery || target instanceof croc.cmp.Widget)) {
                    var widget = target instanceof jQuery ? croc.cmp.Widget.getByElement(target) : target;
                    if (croc.Class.check(widget, 'croc.cmp.form.Button')) {
                        //todo trigger to mbubble
                        widget.on('click', function() {
                            if (!this.__disableOpenMenu) {
                                this.open();
                            }
                        }, this);
                        this.bind('open', widget, 'active');
                        this.on('changeOpen', function(shown) {
                            this.__disableOpenMenu = true;
                            this._getDisposer().defer(function() {
                                this.__disableOpenMenu = false;
                            }, this);
                        }, this);
                    }
                }
            }, this);
        }
    }
});
