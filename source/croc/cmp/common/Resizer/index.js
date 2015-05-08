/**
 * todo не готов к полноценному использованию!
 */
croc.Class.define('croc.cmp.common.Resizer', {
    extend: croc.cmp.Widget,
    
    options: {
        /**
         * @type {Array}
         */
        zones: {}
    },
    
    members: {
        startResize: function(zone) {
            if (!zone.hidden) {
                this._model.ref('resizeZone', 'zones.' + zone.index);
            }
        },
        
        stopResize: function() {
            this._model.removeRef('resizeZone');
            this._model.del('resizeZone');
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.common.Resizer.superclass._initModel.apply(this, arguments);
            this._options.zones.forEach(function(zone, i) {
                zone.index = i;
            });
        }
    }
});
