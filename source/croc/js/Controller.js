croc.Class.define('croc.Controller', {
    type: 'abstract',
    extend: croc.Object,
    
    options: {
        app: {},
        model: {}
    },
    
    statics: {
        /**
         * @type {Array.<croc.Controller>}
         * @static
         */
        classes: []
    },
    
    members: {
        getApp: function() {
            return this._options.app;
        },
        
        getModel: function() {
            return this._options.model;
        },
        
        /**
         * @deprecated
         */
        initDomReady: function() {},
        
        /**
         * Инициализация контроллера
         */
        initFinish: function() {
        },
        
        initModel: function(model) {},
        
        /**
         * @deprecated
         */
        initRender: function() {},
        
        initRoutes: function(app) {},
        
        initStart: function() {}
    },
    
    /**
     * @param Cls
     * @ignore
     */
    onClassCreate: function(Cls) {
        if (Cls.config.type !== 'abstract') {
            croc.Controller.classes.push(Cls);
        }
    }
});
