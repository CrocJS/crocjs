/**
 * Combobox
 */
croc.Class.define('croc.cmp.form.field.ComboBox', {
    extend: croc.cmp.Widget,
    include: croc.cmp.form.MStandardField,
    implement: croc.cmp.form.IField,
    
    options: {
        _wrapper: true
    },
    
    members: {
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.field.ComboBox.superclass._initModel.apply(this, arguments);
            this._options.ddefaults = {
                readOnly: true
            };
        }
    }
});
