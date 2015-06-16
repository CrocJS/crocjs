//+use $.autosize

/**
 * Абстракция над полем ввода
 */
croc.Class.define('croc.ui.form.field.TextArea', {
    extend: croc.ui.form.field.AbstractTextField,
    
    options: {
        /**
         * Класс type_... корневого элемента
         * @type {string}
         */
        cssType: 'area'
    },
    
    construct: function(options) {
        this.once('appear', function() {
            var fieldElement = this.getFieldElement();
            
            var initialHeight = fieldElement.height();
            fieldElement.autosize({className: this.getFieldElement().className});
            
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
        
        croc.ui.form.field.TextArea.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.form.field.TextArea.superclass._getAddRenderData.apply(this, arguments), {
                inputAttrs: '',
                inputTagEnd: (options.value ? _.escape(options.value) : '') + '</textarea>',
                inputTag: 'textarea'
            });
        },
        
        /**
         * Обработать смену состояния валидации поля
         * @param {boolean} valid
         * @protected
         */
        _onValidClassChanged: function(valid) {
            this.getFieldElement().trigger('autosize.resize');
        }
    }
});
