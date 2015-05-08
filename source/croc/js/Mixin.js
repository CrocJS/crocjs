croc.define('croc.Mixin', {
    define: function(name, config) {
        if (!config.extend) {
            config.extend = Object;
        }
        var mixin = croc.Class.define(name, config);
        mixin.isMixin = true;
        return mixin;
    }
});