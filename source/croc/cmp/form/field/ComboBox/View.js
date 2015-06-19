//+use $.autogrowinput

croc.View.define('croc.cmp.form.field.ComboBox.View', {
    construct: function() {
        croc.cmp.form.field.ComboBox.View.superclass.construct.apply(this, arguments);
        this._data.showAddButton = this._data.multiselect;
        this._data.rawState = this._data.multiselect;
        this._widget.onWrapped(this.__setUpArrow, this);
    },
    
    members: {
        multiItemMouseDown: function(e) {
            e.stopPropagation();
            croc.publish('system._combobox-button-click', this);
        },
        
        /**
         * After widget creating
         */
        onCreate: function() {
            croc.cmp.form.field.ComboBox.View.superclass.onCreate.apply(this, arguments);
            
            if (this._data.multiselect) {
                this.__setUpMultiselect();
                this.__setUpMultiSelectFocus();
                this._widget.on('resize', this.__onResize, this);
            }
            else {
                this.__setUpSelectOrCombobox();
            }
            this.__setUpKeyboard();
            
            this._widget.getTextField().on('changeFocused', function(value) {
                if (value) {
                    this._widget.getTextField().moveCursorToEnd();
                }
            }, this);
        },
        
        selectItem: function(e, item) {
            if (this._data.disabled ||
                (e.target.tagName.toLowerCase() === 'input' && e.target.type.toLowerCase() === 'hidden')) {
                return;
            }
            
            this._model.set('selectedItem', item);
            e.preventDefault();
        },
        
        removeItem: function(item) {
            if (!this._data.disabled) {
                this._widget.setValue(_.without(this._data.value || [], item));
            }
        },
        
        /**
         * @param reason
         * @private
         */
        __onResize: function(reason) {
            if (!this._data.rawState) {
                var containerEl = this._widget.getTextField().getFieldContainer();
                this._model.set('rawState', true);
                containerEl.css('width', '');
                containerEl.width(containerEl.width());
                this._model.del('rawState');
            }
        },
        
        /**
         * @private
         */
        __setUpArrow: function() {
            var wasShown;
            var textField = this._widget.getTextField();
            var suggestion = this._widget.getSuggestion();
            
            textField.setDefaultAction({
                action: 'unfold',
                html: '<div class="b-input-action role_unfold"></div>',
                callback: function(el) {
                    el
                        .mousedown(function(e) {
                            wasShown = suggestion.getOpen();
                            e.stopPropagation();
                        })
                        .click(function(e) {
                            if (wasShown) {
                                suggestion.close();
                                var openOnFocus = suggestion.getOpenOnFocus();
                                suggestion.setOpenOnFocus(false);
                                textField.getFieldElement().focus();
                                this._getDisposer().setTimeout(function() {
                                    suggestion.setOpenOnFocus(openOnFocus);
                                }, 150);
                            }
                            else {
                                textField.getFieldElement().focus();
                            }
                            e.preventDefault();
                        }.bind(this));
                    
                    suggestion.listenProperty('open', function(value) {
                        el.toggleClass('state_hover', value);
                    });
                }.bind(this)
            });
            
            textField.resetAction();
        },
        
        /**
         * @private
         */
        __setUpKeyboard: function() {
            var textField = this._widget.getTextField();
            var fieldEl = this._widget.getFieldElement();
            var suggestion = this._widget.getSuggestion();
            var multiSelect = this._data.multiselect;
            
            //если курсор стоит в начале текстового поля, то выделяем последний элемент
            var inputLeftOverflow = function() {
                var textSelection;
                if (multiSelect && !_.isEmpty(this._data.value) && fieldEl.is(':focus') &&
                    (textSelection = croc.utils.domGetTextSelection(fieldEl)).start === 0 &&
                    textSelection.start === textSelection.end) {
                    
                    fieldEl.blur();
                    this._model.set('selectedItem', _.last(this._data.value));
                    return true;
                }
                return false;
            }.bind(this);
            
            this._getDisposer().addListener($(document), 'keydown', function(e) {
                if (this._data.disabled) {
                    return;
                }
                
                var newIndex;
                var keyCode = e.keyCode;
                
                //noinspection FallthroughInSwitchStatementJS
                switch (keyCode) {
                    case 38: //TOP
                    case 40: //BOTTOM
                        var top = keyCode === 38;
                        if (!suggestion.getOpen() && fieldEl.is(':focus')) {
                            this._widget.openSuggestion();
                            if (suggestion.getOpen()) {
                                suggestion.setSelectedItem(top ? -1 : 0);
                            }
                        }
                        break;
                    
                    case 37: //LEFT
                    case 39: //RIGHT
                        if (!multiSelect) {
                            break;
                        }
                        
                        var left = keyCode === 37;
                        if (this._data.selectedItem) {
                            newIndex = Math.max(0,
                                this._data.value.indexOf(this._data.selectedItem) + (left ? -1 : 1));
                            
                            if (newIndex >= this._data.value.length) {
                                this._model.del('selectedItem');
                                fieldEl.focus();
                                croc.utils.domSetCaretPos(fieldEl, 0);
                                e.preventDefault();
                            }
                            else {
                                this._model.set('selectedItem', this._data.value[newIndex]);
                            }
                        }
                        else if (left) {
                            inputLeftOverflow();
                        }
                        
                        break;
                    
                    case 46: //DELETE
                    case 8: //BACKSPACE
                        if (!multiSelect) {
                            break;
                        }
                        
                        var backspace = keyCode === 8;
                        if (this._data.selectedItem) {
                            var index = this._data.value.indexOf(this._data.selectedItem);
                            this._widget.setValue(_.without(this._data.value, this._data.selectedItem));
                            if (!_.isEmpty(this._data.value)) {
                                newIndex = Math.min(this._data.value.length - 1,
                                    Math.max(0, backspace ? index - 1 : index));
                                this._model.set('selectedItem', this._data.value[newIndex]);
                            }
                            else {
                                textField.focus();
                            }
                            e.preventDefault();
                        }
                        else if (backspace) {
                            if (inputLeftOverflow()) {
                                e.preventDefault();
                            }
                        }
                        break;
                }
                
            }, this);
        },
        
        /**
         * @private
         */
        __setUpMultiselect: function() {
            var suggestion = this._widget.getSuggestion();
            var textField = this._widget.getTextField();
            var fieldEl = this._widget.getFieldElement();
            
            //add button
            if (this._data.initialAddButton) {
                croc.Object.listenProperties(
                    textField, 'focused',
                    textField, 'instantValue',
                    suggestion, 'open',
                    _.debounce(this.disposableFunc(function(focused, value, suggOpen) {
                        var showAddButton = !value && !suggOpen && !fieldEl.is(':focus');
                        this.__toggleTextField(!showAddButton);
                        this._model.set('showAddButton', showAddButton);
                    }, this), 50));
            }
            
            //b-input-field sizing
            var containerEl = textField.getFieldContainer();
            containerEl.width(containerEl.width());
            this._model.del('rawState');
            //this.getFieldElement().trigger('autogrowinput');
            this._widget.on('validClassChanged', function() {
                this._widget.onResize();
            }, this);
            
            if (this._data.initialEnableFiltering) {
                if (this._data.initialAddButton) {
                    var addButton = $(this.addButtonElement);
                    fieldEl.css('minWidth',
                        addButton.outerWidth() + croc.utils.domNumericCss(addButton, 'marginRight'));
                }
                
                fieldEl.autoGrowInput({
                    comfortZone: 20
                });
                
                //позиционируем подсказки в случае если высота поля изменилась из-за плагина autoGrowInput
                suggestion.on('changeOpen', function(value) {
                    if (value) {
                        this._getDisposer().defer(function() {
                            if (suggestion.getOpen()) {
                                suggestion.reposition();
                            }
                        }, this);
                    }
                }, this);
            }
            
            //items management
            this._getDisposer().addListener($(document), 'mousedown', function() {
                this._model.del('selectedItem');
            }, this);
            
            this._getDisposer().addListener(croc, 'system._combobox-button-click', function(view) {
                if (this !== view) {
                    this._model.del('selectedItem');
                }
            }, this);
            
            this._model.on('change', 'selectedItem', function(value) {
                if (value || value === 0) {
                    fieldEl.blur();
                }
            }, this);
        },
        
        /**
         * @private
         */
        __setUpMultiSelectFocus: function() {
            var focusObservable = croc.Object.createModel({rawFocus: false, focus: false});
            var textField = this._widget.getTextField();
            var fieldEl = this._widget.getFieldElement();
            
            fieldEl.on({
                focus: function() {
                    textField.setFocused(true);
                    focusObservable.setRawFocus(true);
                }.bind(this),
                blur: function() {
                    textField.setFocused(false);
                    focusObservable.setRawFocus(false);
                }.bind(this)
            });
            
            var setObservableFocus = function() {
                focusObservable.setFocus(!!this._data.selectedItem || focusObservable.getRawFocus());
            }.bind(this);
            this._model.on('change', 'selectedItem', setObservableFocus);
            focusObservable.listenProperty('rawFocus', setObservableFocus);
            
            if (fieldEl.is(':focus')) {
                this.getElement().addClass('state_focus');
            }
            
            this.getElement().mousedown(this.debounce(function() {
                fieldEl.focus();
            }, this));
            
            focusObservable.on('changeFocus', function(value) {
                this.getElement().toggleClass('state_focus', value);
                this._widget.setFocused(value, {internal: true});
            }, this);
            
            this._widget.on('changeFocused', function(value, old, passed) {
                if (!passed || !passed.internal) {
                    if (value) {
                        fieldEl.focus();
                    }
                    else {
                        fieldEl.blur();
                    }
                }
            }, this);
        },
        
        /**
         * @private
         */
        __setUpSelectOrCombobox: function() {
            var suggestion = this._widget.getSuggestion();
            var fieldEl = this._widget.getFieldElement();
            var isSelect = this._data.select;
            
            //подсвечиваем в саджесте текущее значение
            suggestion.listenProperty('open', function(open) {
                if (open) {
                    var value = isSelect ? this._widget.getPlainValue() : this._widget.getTextField().getInstantValue();
                    if (value) {
                        var index = _.findIndex(suggestion.getModel().getItems(),
                            function(item) {
                                return suggestion.normalizeItem(item).value === value;
                            }, this);
                        if (index !== -1) {
                            suggestion.setSelectedItem(index);
                            suggestion.getListManager().showItem(index);
                        }
                    }
                }
            }, this);
            
            if (isSelect) {
                if (this._model.initialEnableFiltering) {
                    fieldEl.on({
                        blur: _.debounce(function() {
                            if (suggestion.getModel().getLength() === 1) {
                                suggestion.selectItem(suggestion.getModel().getItems()[0]);
                            }
                        }.bind(this), 0)
                    });
                }
                else {
                    $(this.fakeInputElement).on('mousedown mouseup click', function(e) {
                        fieldEl.focus();
                        e.preventDefault();
                        e.stopPropagation();
                    });
                }
            }
            
            suggestion.on('choose', function() {
                if (isSelect && fieldEl.is(':focus')) {
                    fieldEl.select();
                }
                suggestion.preventOpening();
            }, this);
        },
        
        /**
         * @param {boolean} value
         * @private
         */
        __toggleTextField: function(value) {
            this._widget.getFieldElement().css({
                position: value ? 'relative' : 'absolute',
                left: value ? 'auto' : -10000
            });
        }
    }
});