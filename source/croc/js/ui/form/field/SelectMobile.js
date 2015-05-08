/**
 * Селект для мобильного
 * В данный момент может быть сконструирован только из разметки
 */
croc.Class.define('croc.ui.form.field.SelectMobile', {
    extend: croc.ui.form.field.ComboBox,

    options: {
        /**
         * Конфиг для текстового поля
         * @type {Object}
         */
        suggestion: {
            value: {
                autoPositioning: false,
                offset: 0,
                positionInset: true,
                mod: 'mobile-select'
            }
        }
    },

    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.SelectMobile.superclass._initWidget.apply(this, arguments);

            this.__unfoldAction = this.getElement().find('.b-input-action.role_unfold');

            var suggestion = this.getSuggestion();
            suggestion.on('close', function() {
                this.__unfoldAction.css('zIndex', '');
            }, this);

            suggestion.on('resize', function(reason) {
                if (reason === 'reposition') {
                    var zIndex = croc.utils.domNumericCss(suggestion.getWrapperElement(), 'zIndex');
                    if (zIndex) {
                        this.__unfoldAction.css('zIndex', zIndex + 1);
                    }
                }
            }, this);

            var originalOptions = suggestion.getModel().cloneRawArray();
            this.on('changeValue', function(value) {
                suggestion.getModel().replaceAll(!value ? originalOptions :
                    [value].concat(_.without(originalOptions, value)));
            }, this);
        }
    }
});
