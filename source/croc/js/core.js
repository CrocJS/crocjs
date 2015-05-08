//+ignore croc.utils

if (croc.initialize) {
    croc.reinit = true;
}
if (!croc.define) {
    /**
     * Create or supplement an object by name in the global scope
     * @param {string} name
     * @param {Object} desc
     * @param {boolean} [dontOverwrite=false]
     */
    croc.define = function(name, desc, dontOverwrite) {
        var result;
        if (croc.utils) {
            result = croc.utils.objAccess(name, croc.utils.objAccess.setVarIfNotExists, desc);
        }
        else {
            var key = name.split('.');
            if (key.length > 2) {
                throw new Error('Пока не подгружен croc.utils невозможно задать ключ длинной более 2-х');
            }
            result = window[key[0]] || (window[key[0]] = {});
            if (key.length > 1) {
                result = result[key[1]] || (result[key[1]] = {});
            }
        }
        if (result !== desc) {
            if (dontOverwrite) {
                _.defaults(result, desc);
            }
            else {
                _.assign(result, desc);
            }
        }
    };
}

/**
 * Infrastructure client application:
 *  - services - don't have access to the DOM elements, created on demand
 *  - controllers - all connected controllers can intercept (use the method hookStage) stages:
 *  bootstrap, render, load. Method initFinish each controller is called after page load.
 *  - events bus PubSub
 *
 *  @message system.application.ready
 *  @message system.application.bootstrap
 *  @message system.application.load
 */
croc.define('croc', {
    isDebug: true,
    isProduction: false,
    
    /**
     * @private
     */
    __publishersOnDemand: {},
    
    /**
     * @private
     */
    __services: [],
    
    /**
     * Returns disposer
     * @returns {croc.util.Disposer}
     */
    getDisposer: function() {
        return this.__disposer || (this.__disposer = new croc.util.Disposer());
    },
    
    /**
     * Get service (create if not exists)
     * @param {Function|string} Cls
     * @returns {*}
     */
    getService: function(Cls) {
        if (typeof Cls === 'string') {
            Cls = croc.utils.objAccess(Cls);
            if (!Cls) {
                return null;
            }
        }
        
        var id = croc.utils.objUniqueId(Cls);
        return this.__services[id] || (this.__services[id] = new Cls());
    },
    
    /**
     * Returns all registered services
     * @returns {Object.<string, croc.Object>}
     */
    getServices: function() {
        return this.__services;
    },
    
    jqPlugin: function(plugin) {
        if (!plugin.$$crocProcessed) {
            plugin($);
            plugin.$$crocProcessed = true;
        }
    },
    
    /**
     * @param {derby.Application} app
     * @param controllers
     */
    initialize: function(app, controllers) {
        var ctrlInstances = (controllers || croc.Controller.classes).map(function(controllerCls) {
            var instance = new controllerCls({app: app});
            if (app) {
                instance.initRoutes(app);
            }
            instance.initStart();
            return instance;
        }, this);
        
        if (app) {
            var modelReady = function(model) {
                this.publishOnDemandOnce('system.application.bootstrap');
                
                //dom ready
                ctrlInstances.forEach(function(controller) {
                    controller.initDomReady();
                });
                
                //model
                ctrlInstances.forEach(function(controller) {
                    controller._options.model = model;
                    controller.initModel(model);
                });
                
                //finish
                ctrlInstances.forEach(function(controller) {
                    controller.initFinish();
                });
                
                this.publishOnDemandOnce('system.application.ready');
            }.bind(this);
            
            if (app.model) {
                modelReady(app.model);
            }
            app.on('model', modelReady);
            if (this.isClient) {
                app.on('render', function(page) {
                    page.model.set('_page.client', true);
                    modelReady(page.model);
                });
                app.on('finishInit', function() {
                    app.model.set('_page.client', true);
                });
            }
        }
        else {
            $(document).ready(function() {
                this.publishOnDemandOnce('system.application.bootstrap');
                
                //render
                ctrlInstances.forEach(function(controller) {
                    controller.initDomReady();
                });
                
                //render
                ctrlInstances.forEach(function(controller) {
                    controller.initRender();
                });
                
                //finish
                ctrlInstances.forEach(function(controller) {
                    controller.initFinish();
                });
                
                this.publishOnDemandOnce('system.application.ready');
            }.bind(this));
            
            $(window).load(function() {
                this.publishOnDemandOnce('system.application.load');
            }.bind(this));
        }
    },
    
    /**
     * Лежит ли данная страница на active/dev/production (в следствии у неё есть доступ к контроллерам)
     * If current page on remote server (then page has access to controllers)
     * @returns {boolean}
     */
    isRemoteServer: function() {
        return !!location.hostname.match(/(^|\.)sotmarket\.ru$/);
    },
    
    /**
     * Creates namespaces to be used for scoping variables and classes so that they are not global. Usage:
     * <pre><code>
     croc.ns('Company', 'Company.data');
     Company.Widget = function() { ... }
     Company.data.CustomStore = function(config) { ... }
     </code></pre>
     * @param {...string} namespaces
     * @deprecated use {@link croc#define}
     */
    ns: function(namespaces) {
        for (var i = 0; i < arguments.length; ++i) {
            croc.utils.objAccess(arguments[i], croc.utils.objAccess.setVarIfNotExists, {});
        }
    },
    
    /**
     * Post a message to the message bus
     * @param event
     * @param {...*} args
     */
    publish: function(event, args) {
        this.__getEventBus().fireEvent.apply(this.__getEventBus(), arguments);
    },
    
    /**
     * Post a message to the message bus. All subscribers are deleted after the publication.
     * @param event
     * @param {...*} args
     */
    publishOnce: function(event, args) {
        this.__getEventBus().fireEvent.apply(this.__getEventBus(), arguments);
        this.__getEventBus().clearListeners(event);
    },
    
    /**
     * Post a message to the message bus. The subscriber will get the message at once after subscription,
     * if subscribed after sending a message.
     * после публикации сообщения.
     * @param event
     * @param {...*} args
     */
    publishOnDemand: function(event, args) {
        this.publish.apply(this, arguments);
        
        if (!this.__publishersOnDemand[event]) {
            this.__publishersOnDemand[event] = [];
        }
        this.__publishersOnDemand[event].push(Array.prototype.slice.call(arguments, 1));
    },
    
    /**
     * Post a message to the message bus. The subscriber will get the message at once after subscription,
     * if subscribed after sending a message. All subscribers are deleted after the publication.
     * @param event
     * @param {...*} args
     */
    publishOnDemandOnce: function(event, args) {
        this.publishOnce.apply(this, arguments);
        
        if (!this.__publishersOnDemand[event]) {
            this.__publishersOnDemand[event] = [];
        }
        this.__publishersOnDemand[event].push(Array.prototype.slice.call(arguments, 1));
    },
    
    /**
     * Subscribe to messages of a specific type of bus messages
     * @param event
     * @param callback
     * @param context
     * @return {function}
     */
    subscribe: function(event, callback, context) {
        var listener = this.__getEventBus().on.apply(this.__getEventBus(), arguments);
        this.__callPublishersOnDemand(event, callback, context);
        return listener;
    },
    
    /**
     * Subscribe to messages of a specific type of bus messages. After getting the message is unsubscribed.
     * @param event
     * @param callback
     * @param context
     * @return {function}
     */
    subscribeOnce: function(event, callback, context) {
        var listener = this.__getEventBus().once.apply(this.__getEventBus(), arguments);
        this.__callPublishersOnDemand(event, callback, context);
        return listener;
    },
    
    /**
     * Unsubscribe from messages
     * @param event
     * @param callback
     * @param context
     */
    unsubscribe: function(event, callback, context) {
        this.__getEventBus().un.apply(this.__getEventBus(), arguments);
    },
    
    /**
     * Delete all subscribers to the message bus
     */
    unsubscribeAll: function() {
        this.__eventBus = null;
        this.__publishersOnDemand = {};
    },
    
    /**
     * @param event
     * @param callback
     * @param context
     * @private
     */
    __callPublishersOnDemand: function(event, callback, context) {
        if (this.__publishersOnDemand[event]) {
            this.__publishersOnDemand[event].forEach(function(args) {
                callback.apply(context || window, args);
            });
        }
    },
    
    /**
     * @returns {croc.Object}
     * @private
     */
    __getEventBus: function() {
        return this.__eventBus || (this.__eventBus = new croc.Object({checkEvents: false}));
    }
}, true);

//todo избавиться от префикса stm, сделать, что-то с конфигом
if (typeof Stm === 'undefined') {
    Stm = {};
}
if (!Stm.env) {
    Stm.env = {};
}
if (!Stm.env.device) {
    Stm.env.device = 'desktop';
    Stm.env.ldevice = 'desktop';
}
if (!Stm.env.project) {
    Stm.env.project = {
        path: '/',
        mainPage: ''
    };
}
if (!Stm.env.resourcePath) {
    Stm.env.resourcePath = '';
}
