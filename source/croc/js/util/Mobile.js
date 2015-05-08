/**
 * Utilities for mobile devices
 */
croc.define('croc.util.Mobile', {
    /**
     * Fit body to screen, and update cropping on window resize. Call the returned function to undo cropping.
     * @param {boolean} [noMargin=false]
     */
    cropBody: function(noMargin) {
        var win = $(window);
        var scrollTop = win.scrollTop();
        var body = $(document.body);
        var crop = function() {
            body.css({
                height: win.innerHeight() + (noMargin ? 0 : scrollTop),
                marginTop: noMargin ? '' : -scrollTop,
                overflow: 'hidden'
            });
        };
        
        win.on('resize', crop);
        crop();
        
        return _.once(function() {
            body.css({height: '', marginTop: '', overflow: ''});
            win.off('resize', crop);
            win.scrollTop(scrollTop);
            setTimeout(function() {win.scrollTop(scrollTop);}, 0);
        });
    },
    
    /**
     * Bind hammer event with delegation
     * @param {jQuery} el
     * @param {string} event
     * @param {string} selector
     * @param {function} callback
     * @param [context]
     */
    delegate: function(el, event, selector, callback, context) {
        Hammer(el[0]).on(event, function(e) {
            var target = $(e.target);
            var curTarget = target.closest(selector, el);
            if (curTarget.length && curTarget[0] !== el[0] && curTarget.closest(el).length) {
                e.currentTarget = curTarget[0];
                callback.call(context || curTarget, e);
            }
        });
    },
    
    /**
     * Prevents global scrolling during a container scrolling on touch devices
     * @param {jQuery} scrollable
     */
    scrollFix: function(scrollable) {
        scrollable.on('touchstart', function() {
            var startTopScroll = this.scrollTop;
            
            if (startTopScroll <= 0) {
                this.scrollTop = 1;
            }
            
            if (startTopScroll + this.offsetHeight >= this.scrollHeight) {
                this.scrollTop = this.scrollHeight - this.offsetHeight - 1;
            }
        });
    }
});