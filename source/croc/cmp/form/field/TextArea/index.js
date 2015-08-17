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
        autosize: true,
        
        /**
         * css class type_... for root DOM-element
         * @type {string}
         */
        cssType: 'area'
    },
    
    members: {
        /**
         * api-ru Инициализация виджета после его отрисовки в DOM
         * api-en Initialization of widget after its rendering in DOM.
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
         * api-ru Обработать смену состояния валидации поля
         * api-en Handle field validation state changing
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
