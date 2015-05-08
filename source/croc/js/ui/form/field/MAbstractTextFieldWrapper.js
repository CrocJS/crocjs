/**
 * Враппер для потомков и врапперов {@link croc.ui.form.field.AbstractTextField}
 */
croc.Mixin.define('croc.ui.form.field.MAbstractTextFieldWrapper', {
    options: {
        /**
         * Добавить ячейки в конец поля
         * @type {string|Array.<string>|croc.ui.Widget|Array.<Widget>}
         */
        cellsAfter: {},
        
        /**
         * Добавить ячейки после ячейки с input
         * @type {string|Array.<string>|croc.ui.Widget|Array.<Widget>}
         */
        cellsAfterInput: {},
        
        /**
         * Добавить ячейки в начало поля
         * @type {string|Array.<string>|croc.ui.Widget|Array.<Widget>}
         */
        cellsBefore: {}
    },
    
    construct: function(options) {
        this._addExtendingWrapperOptions('cellsAfter', 'cellsAfterInput', 'cellsBefore');
    }
});
