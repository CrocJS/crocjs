/**
 * Скрытое поле формы
 */
croc.Class.define('croc.ui.form.field.Hidden', {
    extend: croc.ui.Widget,
    implement: croc.ui.form.field.IField,
    include: croc.ui.form.field.MStandardField,
    
    properties: {
        /**
         * Заблокировано ли поле
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            apply: function(value) {
                if (this.getElement()) {
                    this.getElement()[0].disabled = value;
                }
            },
            option: true
        },
        
        /**
         * Значение поля
         * @type {*}
         */
        value: {
            apply: function(value) {
                if (this.getElement()) {
                    this.getElement().val(value || '');
                }
            },
            event: true
        }
    },
    
    options: {
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '<input type="hidden" value="{value}" class="{cls}" {disabled}>',
        
        /**
         * значение поля
         * @type {*}
         */
        value: {
            property: true,
            value: null
        }
    },
    
    members: {
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.form.field.Hidden.superclass._getAddRenderData.apply(this, arguments), {
                value: this.getValue() || '',
                disabled: this.getDisabled() ? 'disabled="disabled' : ''
            });
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.Hidden.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (this.getElement()) {
                this.setValue(this.getElement().val() || null);
                
                if (!this.getIdentifier() && this.getElement().attr('name')) {
                    options.identifier = this.getElement().attr('name');
                }
            }
        }
    }
});