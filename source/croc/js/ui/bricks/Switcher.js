croc.ns('croc.ui.bricks');

croc.ui.bricks.Switcher = croc.extend(croc.Object, {
    renderTo: undefined,
    count: 2,
    activeItem: 0,
    activeCls: 'state_active',
    suspended: false,
    tpl: '<div class="b-switcher"></div>',
    tplItem: '<div class="b-switcher-item"></div>',
    mod: undefined,
    init: function() {
        var self = this;
        if (!this.renderTo || this.count < 2) {
            return;
        }
        //render switcher to markup
        this.render();
        
        //assign click listener
        this.el.on('mousedown', function() {
            return false; // cancel Bubble event
        });
        this.el.on('mouseup', function() {
            return false; // cancel Bubble event
        });
        this.el.on('click', '.' + $(this.tplItem).attr('class'), function() {
            if (!self.suspended) {
                var idx = parseInt($(this).data('idx'));
                if (self.activeItem !== idx) {
                    //fire event 'change': push new and old indexes
                    self.fireEvent('change', this, idx, self.activeItem);
                    //set active
                    self.setActive(idx);
                }
            }
            return false; // cancel Bubble event
        });
    },
    getCount: function() {
        return this.count;
    },
    render: function() {
        this.el = $(this.tpl);
        
        if (this.mod) {
            this.el.addClass(this.mod);
        }
        
        this.__renderItems();
        
        this.el
            .appendTo(this.renderTo)
            .fadeIn(200);
    },
    setActive: function(idx) {
        this.items
            .eq(this.activeItem).removeClass(this.activeCls).end()
            .eq(idx).addClass(this.activeCls);
        //remember current active item
        this.activeItem = idx;
    },
    setCount: function(count) {
        if (this.count === count) {
            return;
        }
        
        this.count = count;
        this.activeItem = this.activeItem >= count ? count - 1 : this.activeItem;
        
        if (count < 2) {
            if (this.el) {
                this.el.hide();
            }
        }
        else {
            if (this.el) {
                this.el.empty().show();
                this.__renderItems();
            }
            else {
                this.render();
            }
        }
    },
    suspend: function() {
        this.suspended = true;
    },
    unsuspend: function() {
        this.suspended = false;
    },
    __renderItems: function() {
        var item;
        for (var i = 0; i < this.count; i++) {
            item = $(this.tplItem).data('idx', i);
            
            if (i === this.activeItem) {
                item.addClass(this.activeCls);
            }
            
            this.el.append(item);
        }
        
        this.items = this.el.find('.' + $(this.tplItem).attr('class'));
    }
});