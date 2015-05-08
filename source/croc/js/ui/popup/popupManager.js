croc.ui.common.bubble.Manager.registerConfig('popup', {
    closeBehavior: 'stack',
    isManageableFn: function(popup, isOpen) {
        var topPopup = this.getStackTop() === popup ? this.getStack()[this.getStack().length - 2] : this.getStackTop();
        return popup.isWithOverlay() && !(topPopup && topPopup.isFullscreen()) &&
            (isOpen || !popup.hasBackButton() || !!this.getUserData(popup).back);
    },
    listeners: {
        created: function() {
            var manager = this;
            var htmlEl = $('.l-html');
            var mobileCropListener;
            var animationDuration = Stm.env.ldevice === 'mobile' ? 100 : 200;
            this.getOpenCollection().on('change', function(index, remove, insert) {
                var bgOverlay = $('.b-overlay.js-global-overlay:not(.js-to-remove):last');
                var crop = this.getArray().some(function(x) { return x.isWithOverlay(); });
                
                var doCrop = function() {
                    htmlEl.toggleClass('view_crop', crop);
                    htmlEl.add('.jsg-crop-compensation').each(function(i, el) {
                        el = $(el);
                        if (!crop) {
                            el.css('marginRight', '');
                        }
                        else {
                            var cond = el.data('cropCompensationCondition');
                            if (!cond || el.is(cond)) {
                                el.css('marginRight', croc.utils.scrollbarWidth());
                            }
                        }
                    });
                };
                
                var topPopup = manager.getStack()[manager.getStack().length - insert.length - 1];
                var overFullscreenPopup = topPopup && topPopup.isFullscreen();
                
                if (insert.length && crop) {
                    doCrop();
                    if (overFullscreenPopup) {
                        bgOverlay = $();
                    }
                    if (!bgOverlay.length) {
                        bgOverlay = $('' +
                        '<div class="b-overlay view_default bg_black js-global-overlay">' +
                        '<div class="b-overlay-h"></div>' +
                        '</div>')
                            .css({
                                opacity: 0,
                                zIndex: croc.utils.domNumericCss(insert[0].getWrapperElement(), 'zIndex') - 1
                            })
                            .appendTo(document.body);
                        
                        if (overFullscreenPopup &&
                            croc.utils.domIsElementOpenerOf(topPopup.getElement(), insert[0].getElement())) {
                            croc.utils.domLinkElementToOpener(bgOverlay, topPopup.getElement());
                        }
                        
                        if (Stm.env.ldevice === 'mobile' && !overFullscreenPopup) {
                            mobileCropListener = manager._getDisposer().addCallback(croc.util.Mobile.cropBody(
                                this.getArray().some(function(x) { return x.isFullscreen(); })));
                        }
                    }
                    bgOverlay.stop(true).animate({opacity: 1}, animationDuration);
                }
                if (remove.length && (!crop || overFullscreenPopup) && bgOverlay.length) {
                    bgOverlay.stop(true);
                    if (Stm.env.ldevice === 'mobile' && remove[0].getShown()) {
                        bgOverlay.delay(200);
                    }
                    bgOverlay.addClass('js-to-remove');
                    bgOverlay.animate({opacity: 0}, animationDuration, function() {
                        bgOverlay.remove();
                        doCrop();
                    });
                    if (mobileCropListener && !overFullscreenPopup) {
                        mobileCropListener.remove();
                    }
                }
                
                insert.forEach(function(popup) {
                    if (popup.hasBackButton()) {
                        var data = manager.getUserData(popup);
                        data.backListener = popup.on('back', function() {
                            data.back = true;
                            popup.close();
                            delete data.back;
                        });
                    }
                });
                
                remove.forEach(function(popup) {
                    var data = manager.getUserData(popup);
                    if (data.backListener) {
                        data.backListener();
                        delete data.backListener;
                    }
                });
            });
        }
    }
});