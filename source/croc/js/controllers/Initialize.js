/**
 * Главный контроллер приложения
 *
 * @message system.page.beforeUnload
 * @message system.page.postBeforeUnload
 */
croc.Class.define('croc.controllers.Initialize', {
    extend: croc.Controller,
    members: {
        /**
         * Инициализация контроллера
         */
        initFinish: function() {
            if (croc.isClient) {
                this.__setUpUnloading();
                
                $('.js-construct').each(function() {
                    var el = $(this);
                    var plugin = el.data('plugin');
                    if (plugin) {
                        var pluginConf = el.data('pluginConf');
                        var plugins = (Array.isArray(plugin) ? plugin : [plugin]).map(function(name, index) {
                            var Plugin = croc.Class.getClass(name);
                            var conf = pluginConf && (Array.isArray(pluginConf) ? pluginConf[index] : pluginConf);
                            return new Plugin(conf ? _.assign({el: el}, conf) : {el: el});
                        }, this);
                        el.data('$$plugins', plugins);
                    }
                });
                
                if (croc.isDebug) {
                    $(document.body).click(function(e) {
                        var widget = $(e.target).closest('.js-widget');
                        if (widget.length) {
                            window.$widget = croc.cmp.Widget.getByElement(widget);
                        }
                    });
                }
            }
        },
        
        /**
         * @private
         */
        __setUpUnloading: function() {
            this._getDisposer().addListener($(window), 'beforeunload', function() {
                var preventUnloadText;
                var preventUnload = function(text) {
                    preventUnloadText = text;
                };
                croc.publish('system.page.beforeUnload', preventUnload);
                if (preventUnloadText) {
                    return preventUnloadText;
                }
                else {
                    croc.publish('system.page.postBeforeUnload');
                }
            });
        }
    }
});
