/**
 * todo убрать упоминания b-suggestion-item
 */
croc.View.define('croc.cmp.form.suggestion.Suggestion.View', {
    members: {
        higlightLabel: function(label, normalized) {
            label = croc.utils.strHighlightSubstring(label, this._widget.getSearchableModel().getSearchString());
            return normalized && normalized.value === null ?
            '<span class="g-font color_gray">' + label + '</span>' : label;
        },
        
        /**
         * Стоит ли закрывать bubble после клика по данному элементу
         * @param {jQuery} targetEl
         * @returns {boolean}
         */
        isClosingOnHtmlClickAllowed: function(targetEl) {
            return croc.cmp.form.suggestion.Suggestion.View.superclass.isClosingOnHtmlClickAllowed.apply(this,
                    arguments) && !croc.utils.domIsElementOpenerOf(targetEl, this._widget.getElement());
        },
        
        onCreate: function() {
            croc.cmp.form.suggestion.Suggestion.View.superclass.onCreate.apply(this, arguments);
            
            this._widget.listenProperty('field', function(field) {
                if (field) {
                    this.__initField(field);
                }
            }, this);
            
            this.__setUpSuggestionsBehavior();
        },
        
        /**
         * @param field
         * @private
         */
        __initField: function(field) {
            this.__field = field;
            
            //remove native autocomplete
            field.getFieldElement().attr('autocomplete', 'off');
            
            if (!this._widget.getTarget()) {
                this._widget.setTarget(field.getElement());
            }
            
            //запрещаем убирать фокус с поля
            if (Stm.env.device === 'desktop') {
                this._widget.getElement().on('mousedown mouseup click', function(e) {
                    if (e.type === 'click' && $(e.target).closest('.b-suggestion-item').length) {
                        return;
                    }
                    
                    if (this.__focusTimeout) {
                        this.__focusTimeout.remove();
                    }
                    
                    this.__setInternalFocus();
                    field.focus();
                    this.__focusTimeout = this._getDisposer().setTimeout(function() {
                        this.__setInternalFocus();
                        field.focus();
                    }.bind(this), 10);
                }.bind(this));
            }
            
            this._widget.on('choose', function(item) {
                if (this._model.get('blurOnChoose')) {
                    this.__field.blur();
                    if (this.__focusTimeout) {
                        this.__focusTimeout.remove();
                    }
                }
                else if (!this._widget.getDisableTextSelection()) {
                    this.__setInternalFocus();
                    this.__field.select();
                }
            }, this);
            
            //action
            var stream = this._widget.getModel().lookup(croc.data.chain.IStream);
            if (stream) {
                stream.listenProperty('loading', function(value) {
                    if (value) {
                        field.setAction({
                            action: 'loading',
                            html: '<div class="b-input-action role_loader"></div>'
                        });
                    }
                    else {
                        field.resetAction();
                    }
                });
            }
            
            this.__setUpFieldEvents();
        },
        
        /**
         * @return {*}
         * @private
         */
        __onKeyNavigate: function(e) {
            var keyCode = e.keyCode;
            
            //noinspection FallthroughInSwitchStatementJS
            switch (keyCode) {
                //move selection
                case 38: /*UP*/
                case 40: /*DOWN*/
                    if (this._widget.getOpen()) {
                        this._model.set('itemSelectingMethod', 'keydown');
                        this._widget.moveSelection(keyCode === 40);
                        this._model.del('itemSelectingMethod');
                        
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    return false;
                
                case 13: /*ENTER*/
                    if (this._model.get('selectedItem')) {
                        this._widget.chooseItem(this._model.get('selectedItem'));
                        e.preventDefault();
                    }
                    else if (!this._model.get('submitRawText')) {
                        e.preventDefault();
                    }
                    
                    return false;
                
                case 27: /*ESCAPE*/
                    if (this.__field && this.__field.getInstantValue()) {
                        this.__field.setValue(null);
                        e.stopPropagation();
                    }
                    this._widget.close();
                    return false;
            }
            
            return true;
        },
        
        /**
         * @private
         */
        __setInternalFocus: function() {
            if (this.__internalFocusTimeout) {
                this.__internalFocusTimeout.remove();
            }
            
            this.__internalFocus = true;
            this.__internalFocusTimeout = this._getDisposer().setTimeout(function() {
                this.__internalFocus = false;
                this.__internalFocusTimeout = null;
            }.bind(this), 10);
        },
        
        /**
         * @private
         */
        __setUpFieldEvents: function() {
            var blurTimeout;
            var fieldEl = this.__field.getFieldElement();
            
            this._getDisposer().addListeners(fieldEl, {
                keydown: function(e) {
                    this.__onKeyNavigate(e);
                }.bind(this),
                
                blur: function() {
                    if (Stm.env.device === 'desktop' && !this.__isMouseOverSuggestions) {
                        blurTimeout = this._getDisposer().setTimeout(function() {
                            this._data.fieldActive = false;
                            this._widget.close();
                        }.bind(this), 250);
                    }
                }.bind(this),
                
                'focus click': function() {
                    if (blurTimeout) {
                        blurTimeout.remove();
                    }
                    
                    if (this._widget.getOpenOnFocus() && !this._widget.getOpen() && !this.__internalFocus) {
                        this._getDisposer().setTimeout(function() {
                            if (!this._widget.getOpenOnFocus() || this._widget.getOpen() || !fieldEl.is(':focus')) {
                                return;
                            }
    
                            this._data.fieldActive = true;
                            if (this._model.get('openSuggestionOnFirstFocus') && this.__dirtyState && this.__field.getValue()) {
                                this._widget.getSearchableModel().setSearchString(this.__field.getValue());
                            }
                            else if (!this._widget.open() && this._widget.getShowUnfilteredOnFocus() && !this._widget.getSearchableModel().getSearchString()) {
                                this._widget.showItemsUnfiltered();
                            }
                        }.bind(this), 100);
                    }
                }.bind(this)
            });
        },
        
        /**
         * @private
         */
        __setUpSuggestionsBehavior: function() {
            this._widget.on('changeShown', function() {
                this.__isMouseOverSuggestions = false;
            }, this);
            
            this._widget.on('itemClick', function(item) {
                this._widget.chooseItem(item);
                if (this.__field && !this._model.get('blurOnChoose')) {
                    this.__setInternalFocus();
                    this.__field.focus();
                }
            }, this);
            
            ////click by error
            //this.getElement().find(this.__errorSelector).click(function() {
            //    this.close();
            //}.bind(this));
            
            //mouseover mouseleave
            this._widget.getElement().on('mouseover', '.b-suggestion-item', function(e) {
                this.__isMouseOverSuggestions = true;
                
                var goToSelectedItem = this._model.set('goToSelectedItem', false) || false;
                this._model.set('itemSelectingMethod', 'mouseover');
                this._model.set('selectedItem', this._widget.getListManager().getItem($(e.currentTarget)));
                this._model.del('itemSelectingMethod');
                this._model.set('goToSelectedItem', goToSelectedItem);
            }.bind(this));
            
            this._widget.getElement().mouseleave(function() {
                this.__isMouseOverSuggestions = false;
            }.bind(this));
        }
    }
});
