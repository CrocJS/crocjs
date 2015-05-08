/**
 * Сервис для загрузки ресурсов (например, скриптов)
 * todo частично вынести в сотмаркет
 */
croc.Class.define('croc.services.Resources', {
    extend: croc.Object,
    
    statics: {
        /**
         * @static
         */
        LOAD_TIMEOUT: 10000,
        
        /**
         * @static
         * @private
         */
        __TPL_REGEXP: /<script type="text\/x-jquery-tmpl" data-register="(.*?)">([\s\S]*?)<\/script>/g,
        
        /**
         * @static
         */
        scripts: {
            facebook: {
                url: '//connect.facebook.net/en_US/all.js#xfbml=1&appId={id}',
                urlData: function() {
                    return {
                        id: Stm.env.apiKeys.likeButton.fb
                    };
                },
                awaitLoading: false,
                preRequest: function() {
                    if (!$('#fb-root').length) {
                        $('<div id="fb-root"></div>').appendTo('body');
                    }
                },
                postRequest: function() {
                    var deferred = $.Deferred();
                    var init = function() {
                        if (window.FB) {
                            deferred.resolve();
                        }
                        else {
                            deferred.reject();
                        }
                    };
                    
                    if (typeof FB !== 'undefined') {
                        deferred.resolve();
                    }
                    else if (window.fbAsyncInit) {
                        var oldInit = window.fbAsyncInit;
                        window.fbAsyncInit = function() {
                            oldInit();
                            init();
                        };
                    }
                    else {
                        window.fbAsyncInit = init;
                    }
                    
                    return deferred;
                }
            },
            
            gmaps: {
                check: 'google.maps',
                request: function(instance) {
                    var deferred = $.Deferred();
                    window.StmGmapsInitialize = function() {
                        window.StmGmapsInitialize = undefined;
                        deferred.resolve();
                    };
                    
                    instance.loadScript('_gmaps').fail(function() {
                        deferred.reject();
                    });
                    
                    return deferred;
                }
            },
            
            gplus: {
                url: 'https://apis.google.com/js/plusone.js',
                check: 'gapi.plusone.render'
            },
            
            odnoklassniki: {
                url: 'http://connect.ok.ru/connect.js',
                check: 'OK.CONNECT'
            },
            
            twitter: {
                url: '//platform.twitter.com/widgets.js',
                check: 'twttr.widgets'
            },
            
            vk: {
                url: '//vk.com/js/api/openapi.js?98',
                check: 'VK',
                postRequest: function() {
                    VK.init({
                        apiId: Stm.env.apiKeys.likeButton.vk,
                        onlyWidgets: true
                    });
                }
            },
            
            ymaps: {
                url: '//api-maps.yandex.ru/2.0/?load=package.full&lang=ru-RU&ns=ymaps',
                check: 'ymaps',
                postRequest: function() {
                    var deferred = $.Deferred();
                    if (!ymaps.ready) {
                        deferred.reject();
                    }
                    else {
                        ymaps.ready(function() {
                            deferred.resolve();
                        });
                    }
                    
                    return deferred;
                }
            },
            
            _gmaps: {
                url: '//maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&language=ru&libraries=places&callback=StmGmapsInitialize'
            }
        },
        
        /**
         * @param src
         * @param {boolean} [resolvePath=false]
         */
        loadImage: function(src, resolvePath) {
            croc.getService(croc.services.Resources).loadImage(src, resolvePath);
        },
        
        /**
         * @param src
         * @returns {string}
         */
        resolvePath: function(src) {
            return croc.getService(croc.services.Resources).resolvePath(src);
        }
    },
    
    construct: function() {
        this.__scriptsDeferreds = {};
        this.__templates = {};
        croc.services.Resources.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * Get already loaded template
         * @returns {string}
         */
        getTemplate: function(name) {
            if (typeof this.__templates[name] !== 'string') {
                throw new Error('Template has\'nt been loaded!');
            }
            return this.__templates[name];
        },
        
        /**
         * @param src
         * @param {boolean} [resolvePath=false]
         * @returns {$.Deferred}
         */
        loadImage: function(src, resolvePath) {
            return croc.util.ImagesPreloader.load(resolvePath ? this.resolvePath(src) : src);
        },
        
        /**
         * Загрузить ресурс
         * @param {string} name
         * @returns {$.Deferred}
         */
        loadScript: function(name) {
            if (this.__scriptsDeferreds[name]) {
                return this.__scriptsDeferreds[name];
            }
            
            var deferred;
            var config = croc.services.Resources.scripts[name];
            
            if (!config) {
                throw new Error('Запрошен неверный ресурс: ' + name);
            }
            
            //prerequest
            if (config.preRequest) {
                config.preRequest();
            }
            
            //request
            var requestDeferred;
            if (config.request) {
                requestDeferred = deferred = config.request(this, config) || $.Deferred().resolve();
            }
            else {
                requestDeferred = deferred =
                    this.__loadScript(config.urlData ? config.url.render(config.urlData(config)) : config.url);
                if (config.awaitLoading === false) {
                    deferred = $.Deferred().resolve();
                }
            }
            
            //check
            if (config.check) {
                deferred = deferred.then(function() {
                    return croc.utils.objAccess(config.check) ? $.Deferred().resolve() : $.Deferred().reject();
                }, croc.utils.defRejectCallback);
            }
            
            //post request
            if (config.postRequest) {
                deferred = deferred.then(function() {
                    return config.postRequest(this);
                }.bind(this), croc.utils.defRejectCallback);
            }
            
            this.__scriptsDeferreds[name] = deferred;
            deferred.fail(function() {
                delete this.__scriptsDeferreds[name];
            }.bind(this));
            
            var rejectTimeout = this._getDisposer().setTimeout(function() {
                if (requestDeferred.state() === 'pending') {
                    if (requestDeferred.abort) {
                        requestDeferred.abort();
                    }
                    else {
                        requestDeferred.reject();
                    }
                }
                else if (deferred.reject) {
                    deferred.reject();
                }
                else if (deferred.abort) {
                    deferred.abort();
                }
            }, croc.services.Resources.LOAD_TIMEOUT);
            deferred.always(function() {
                rejectTimeout.remove();
            });
            
            return deferred;
        },
        
        /**
         * todo убрать в stm
         * Загрузить шаблон из d/tpl
         * @returns {$.Deferred}
         */
        loadTemplate: function(name) {
            var ext = name.substr(name.length - 4);
            if (ext !== '.tpl' && ext !== '.php') {
                name += '.tpl';
            }
            
            if (name in this.__templates) {
                return typeof this.__templates[name] === 'string' ?
                    $.Deferred().resolve(this.__templates[name]) :
                    this.__templates[name];
            }
            
            var re = croc.services.Resources.__TPL_REGEXP;
            var key = '&device=' + Stm.env.device + '&ldevice=' + Stm.env.ldevice +
                (Stm.env.IS_PROTOTYPE ? '&debug_tpl=1' : '');
            //noinspection UnnecessaryLocalVariableJS
            var deferred = this.__templates[name] = $.ajax({
                //TODO: доработать анализатор, чтобы d/tpl был настраеваемым для подпроектов
                url: (Stm.env.project.tplPath || Stm.env.project.path) + 'd/tpl/' + name + '?' + new Date().getTime() + key,
                type: 'get',
                dataType: 'html',
                async: true,
                timeout: 50000
            }).done(function(result) {
                result = result.replace(re, function(match, subName, content) {
                    this.__templates[name + ':' + subName] = content.trim();
                    return '';
                }.bind(this));
                return this.__templates[name] = result.trim(); // jshint ignore:line
            }.bind(this));
            
            return deferred;
        },
        
        resolvePath: function(path) {
            return Stm.env.resourcePath + path;
        },
        
        /**
         * @param {string} url
         * @returns {$.Deferred}
         * @private
         */
        __loadScript: function(url) {
            var deferred = $.Deferred();
            var script = document.createElement('script');
            script.src = url;
            script.async = true;
            if (croc.util.Browser.isIE('<10')) {
                script.defer = true;
            }
            document.body.appendChild(script);
            
            script.onload = function() {
                if (!script.executed) { // выполнится только один раз
                    script.executed = true;
                    deferred.resolve();
                }
            };
            
            script.onerror = function() {
                deferred.reject();
            };
            
            script.onreadystatechange = function() {
                if (script.readyState === "complete" || script.readyState === "loaded") {
                    setTimeout(script.onload, 0);
                }
            };
            
            deferred.abort = function() {
                $(script).remove();
                deferred.reject();
            };
            
            return deferred;
        }
    }
});
