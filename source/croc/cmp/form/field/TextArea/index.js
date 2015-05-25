//+use $.autosize

/**
 * TextArea abstraction
 */
croc.Class.define('croc.cmp.form.field.TextArea', {
    extend: croc.cmp.form.field.AbstractTextField,
    
    options: {
        /**
         * Enable autosize on input
         * @type {boolean}
         */
        autosize: true
    },
    
    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @protected
         */
        _initWidget: function() {
            croc.cmp.form.field.TextArea.superclass._initWidget.apply(this, arguments);
            if (this._options.autosize) {
                this.onAppear(function() {
                    var fieldElement = this.getFieldElement();
                    
                    var initialHeight = fieldElement.height();
                    fieldElement.autosize({className: fieldElement.className});
                    
                    this.on('changeInstantValue', function() {
                        fieldElement.trigger('autosize.resize');
                    }, this);
                    fieldElement.on('autosize.resize', function() {
                        this.bubbleResize();
                    }.bind(this));
                    
                    if (fieldElement.height() !== initialHeight) {
                        this.bubbleResize();
                    }
                }, this);
            }
        },
        
        /**
         * Обработать смену состояния валидации поля
         * @param {boolean} valid
         * @protected
         */
        _onValidClassChanged: function(valid) {
            var el = this.getFieldElement();
            if (el) {
                this.getFieldElement().trigger('autosize.resize');
            }
        }
    }
});
