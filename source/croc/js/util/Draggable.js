croc.ns('croc.util');

croc.util.Draggable = croc.extend(croc.Object, {
    el: undefined,
    minPos: 0,
    maxPos: 0,
    dragging: false,
    startPos: 0,
    startFrom: undefined,
    
    /**
     * тянем по горизонтали или по вертикали
     * @type {boolean}
     */
    horizontal: true,
    
    /**
     * Учитывать место клика по элементу
     * @type {boolean}
     */
    relativeToElement: false,
    
    onDragStart: _.noop,
    onDrag: _.noop,
    onDragEnd: _.noop,
    init: function() {
        var self = this;
        this.delta = 0;
        self.el.bind({
            mousedown: $.proxy(function(e) {
                self.startPos = $.isFunction(self.startFrom) ? self.startFrom(e) : self.startFrom;
                if (self.startPos === undefined) {
                    return true;
                }
                self.delta = !self.relativeToElement ? 0
                    : self.horizontal ? (self.el.offset().left - e.pageX) : (self.el.offset().top - e.pageY);
                
                self.onDragStart();
                self.dragging = true;
                self.onDrag(this.checkPosition(e));
                $(document).bind('mousemove', $.proxy(this.drag, this));
                $(document).bind('mouseup', $.proxy(this.end, this));
                return false;
            }, this)
        });
    },
    checkPosition: function(x) {
        if ($.type(x) == 'object') {
            x = (this.horizontal ? x.pageX : x.pageY) - this.startPos + this.delta;
        }
        if (x < this.minPos) {
            return this.minPos;
        }
        if (x > this.maxPos) {
            return this.maxPos;
        }
        return x;
    },
    end: function(e) {
        $(document).unbind('mousemove', this.drag);
        $(document).unbind('mouseup', this.end);
        this.onDragEnd(this.checkPosition(e));
        this.dragging = false;
    },
    drag: function(e) {
        this.dragging = true;
        this.onDrag(this.checkPosition(e), e);
        return false;
    },
    dragTo: function(x) {
        this.drag(this.checkPosition(x));
    },
    setMax: function(x) {
        this.maxPos = x;
    },
    isDragging: function() {
        return this.dragging;
    }
});