croc.Class.define('test.cmp.Test2', {
    extend: croc.cmp.Widget,
    
    members: {
        click: function() {
            console.log('clicked');
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            test.cmp.Test2.superclass._initModel.apply(this, arguments);
            this.getParent()._model.set('some', 'ololo');
        }
    }
});