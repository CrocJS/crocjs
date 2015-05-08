/**
 * Главный контроллер приложения
 *
 * @message system.page.beforeUnload
 * @message system.page.postBeforeUnload
 */
croc.Class.define('croc.controllers.InitializeOld', {
    extend: croc.Controller,
    members: {
        /**
         * Инициализация контроллера
         */
        initFinish: function() {
            this.__setUpNotifications();
            this.__setUpUnloading();
            
            //prevent b-overlay scroll
            $(document.body).on('mousewheel', '.b-overlay', function(e) {e.stopPropagation();});
        },
        
        initRender: function() {
            this.__renderWidgets();
        },
        
        /**
         * @private
         */
        __renderWidgets: function() {
            $('.js-construct').each(function() {
                var el = $(this);
                if (el.data('xtype')) {
                    croc.ui.Widget.getByElement(el, false, true);
                }
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
            
            $('.js-generate').each(function() {
                croc.ui.Widget.generateWidget($(this));
            });
        },
        
        /**
         * @private
         */
        __setUpNotifications: function() {
            var Manager = croc.Class.getClass('croc.ui.notifications.Manager');
            if (Manager) {
                var handler = this._getDisposer().addListener(croc, 'system.ajax.response', function(id, response) {
                    if (!response) {
                        return;
                    }
                    
                    var message = response.errcode === 1 || response.$$parseError ? 'Внутренняя ошибка на сервере.' :
                        response.errcode === 2 ? 'Сервис временно недоступен.' :
                            response.$$statusCode >= 400 ? 'При обращении к серверу произошла ошибка.' : null;
                    
                    if (message) {
                        Manager.showNotification(message, 'error');
                    }
                });
                
                this._getDisposer().addListener(croc, 'system.page.postBeforeUnload', function() {
                    handler.remove();
                });
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
