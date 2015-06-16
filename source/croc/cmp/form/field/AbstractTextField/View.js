croc.View.define('croc.cmp.form.field.AbstractTextField.View', {
    members: {
        /**
         * After widget creating
         */
        onCreate: function() {
            croc.cmp.form.field.AbstractTextField.View.superclass.onCreate.apply(this, arguments);
            
            this._widget.on('changeInstantValue', function(value) {
                if (!this._widget.getFieldElement().is(':focus')) {
                    this._widget.setValue(value || '');
                }
            }, this);
            
            this.__setUpAbstractTextFieldBehavior();
            if (this._data.selectionBehavior) {
                this.__setUpSelectionBehavior();
            }
            
            this._widget.listenProperty('action', _.debounce(this.disposableFunc(function(action) {
                if (action && action.callback) {
                    action.callback($(this.actionCellElement).children());
                }
            }, this), 0));
            
            if (this._data.manageFocus) {
                this._widget.listenProperty('focused', function(value) {
                    this.getElement().toggleClass('state_focus', !!value);
                }, this);
            }
            
            if (Stm.env.device === 'desktop') {
                this.getElement().mousedown(_.throttle(this.disposableFunc(function() {
                    this._widget.getFieldElement().focus();
                }, this)));
            }
            else if (Stm.env.ldevice === 'mobile') {
                this.__mobileShowOnFocus();
            }
        },
        
        /**
         * @private
         */
        __mobileShowOnFocus: function() {
            var winEl = $(window);
            var el = this.getElement();
            var gap = 20;
            var scroll = function() {
                var scrollable = this._widget.getFieldElement();
                while (true) {
                    scrollable = scrollable.parents('.g-scrollable-h:eq(0)');
                    if (!scrollable.length) {
                        scrollable = winEl;
                        break;
                    }
                    if (scrollable[0].clientHeight < scrollable[0].scrollHeight) {
                        break;
                    }
                }
                
                var delta;
                if (this._data.mobileScrollTop) {
                    delta = el.offset().top - winEl.scrollTop() - gap;
                }
                else {
                    delta = Math.max(0, el.offset().top + el.height() - (winEl.scrollTop() + window.innerHeight) + gap);
                }
                if (delta !== 0) {
                    scrollable.scrollTop(scrollable.scrollTop() + delta);
                }
            }.bind(this);
            
            var timeout;
            this._widget.getFieldElement().on({
                focus: function() {
                    timeout = this._getDisposer().setTimeout(scroll, 300);
                }.bind(this),
                blur: function() {
                    if (timeout) {
                        timeout.remove();
                    }
                }
            });
        },
        
        /**
         * @private
         */
        __setUpAbstractTextFieldBehavior: function() {
            var inputEl = this._widget.getFieldElement();
            inputEl
                .on('input propertychange keyup focus blur', function(e) {
                    var value = inputEl.val();
                    if (this._data.transformOnUpdateFunc) {
                        value = this._data.transformOnUpdateFunc(value);
                    }
                    if (value !== inputEl.val()) {
                        this._widget.setInstantValue(value);
                    }
                }.bind(this))
            //.on('cut', function() {
            //    this._getDisposer().defer(function() {
            //        this.setInstantValue(this._getFieldValue());
            //    }, this);
            //}.bind(this));
            
            //don't focus field on click on action
            var cellAction = $(this.actionCellElement);
            cellAction.mousedown(function(e) {e.stopPropagation();});
            cellAction.on('touchstart', function(e) {e.stopPropagation();});
        },
        
        /**
         * @private
         */
        __setUpSelectionBehavior: function() {
            var smartSelectOnClick = this._data.selectionBehavior === 'smartSelectOnClick';
            var selectOnFocus = this._data.selectionBehavior === 'selectOnFocus';
            
            var prevSelection;
            var focused;
            var field = this._widget.getFieldElement();
            
            field.on({
                mousedown: function() {
                    focused = !field.is(':focus');
                    prevSelection = croc.utils.domGetTextSelection(field);
                },
                mouseleave: function() {
                    prevSelection = null;
                },
                mouseup: function(e) {
                    if (!prevSelection) {
                        return;
                    }
                    
                    var selection = croc.utils.domGetTextSelection(field);
                    
                    var select;
                    if (selectOnFocus) {
                        select = focused;
                    }
                    else {
                        select = (focused || selection.length !== field.val().length) &&
                        ((prevSelection.start === selection.start && prevSelection.end === selection.end) ||
                        selection.length === 0);
                    }
                    
                    if (select) {
                        field.select();
                        e.preventDefault();
                    }
                }
            });
        }
    }
});