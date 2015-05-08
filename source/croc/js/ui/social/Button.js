/**
 * Социальная кнопка (шаринг, лайк)
 * todo $('meta[property="og:title"]') оптимизировать выборку
 * todo подогнать размеры диалогов шаринга
 */
croc.Class.define('croc.ui.social.Button', {
    extend: croc.ui.Widget,
    
    statics: {
        /**
         * @private
         * @static
         */
        __SHARE_DIALOG_HEIGHT: 345,
        
        /**
         * @private
         * @static
         */
        __SHARE_DIALOG_TITLES: {
            vk: 'ВКонтакте',
            fb: 'Facebook',
            gplus: 'Google+',
            twitter: 'Twitter',
            odnoklassniki: 'Одноклассники'
        },
        
        /**
         * @private
         * @static
         */
        __SHARE_DIALOG_WIDTH: 690,
        
        /**
         * @private
         * @static
         */
        __SHARE_URLS: {
            vk: 'https://vk.com/share.php?url={url}',
            fb: 'https://www.facebook.com/sharer/sharer.php?s=100&p[url]={url}',
            gplus: 'https://plus.google.com/share?url={url}',
            twitter: 'https://twitter.com/intent/tweet?url={url}&counturl={countUrl}',
            odnoklassniki: 'http://www.odnoklassniki.ru/dk?st.cmd=addShare&st.s=2&st.noresize=on&st._surl={url}'
        }
    },
    
    events: {
        /**
         * Клик по кнопке (только action=share)
         */
        click: null,
        
        /**
         * Действие было совершено (только action=like)
         */
        executed: null
    },
    
    properties: {
        /**
         * Действие для кнопки
         * @type {string}
         */
        action: {
            cssClass: true,
            check: ['like', 'share'],
            value: 'like',
            getter: null,
            __setter: null,
            option: true
        },
        
        /**
         * this|main|custom url. Изменять динамически можно только для action===share.
         * @type {string}
         */
        page: {
            type: 'string',
            value: 'this',
            option: true,
            event: true
        },
        
        /**
         * action: like - vk|twitter|gplus|fb
         * action: share - vk|twitter|gplus|fb|odnoklassniki
         * @type {string}
         */
        service: {
            cssClass: true,
            type: 'string',
            getter: null,
            __setter: null,
            option: true
        },
        
        /**
         * Скин кнопок
         * @type {string}
         */
        skin: {
            cssClass: true,
            type: 'string',
            value: 'default',
            option: true
        },
        
        /**
         * Заголовок. Если не указан, то берётся со страницы.
         * @type {string}
         */
        title: {
            type: 'string',
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * Только для service==='twitter'
         * @type {string}
         */
        countUrl: {
            type: 'string'
        },
        
        /**
         * Описание страницы. Если не указано, то берётся из страницы.
         * @type {string}
         */
        description: {
            type: 'string'
        },
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '<div class="b-social-button{cls}">{content}</div>',
        
        /**
         * Изображения для диалога "рассказать друзьям".
         * @type {string}
         */
        image: {
            type: 'string'
        },
        
        /**
         * Сокращать ли ссылку
         * @type {boolean}
         */
        shortenLink: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Адрес страницы для шаринга. Алиас к page.
         * @type {string}
         */
        url: {
            type: 'string'
        }
    },
    
    construct: function(options) {
        this.listenProperty('page', function(value) {
            this.__url =
                value === 'this' ? Stm.env.project.mainPage + location.pathname :
                    value === 'main' ? Stm.env.project.mainPage + '/' :
                        !value.match(/^https?:\/\//) ? Stm.env.project.mainPage + value :
                            value;
        }, this);
        
        /**
         * @type {croc.services.Resources}
         * @private
         */
        this.__resources = croc.getService(croc.services.Resources);
        
        croc.ui.social.Button.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * Адрес страницы
         * @returns {string}
         */
        getUrl: function() {
            return this.__url;
        },
        
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.social.Button.superclass._getAddRenderData.apply(this, arguments), {
                content: (options.action === 'like' && {
                    'twitter': '<a href="https://twitter.com/share" class="twitter-share-button">Твитнуть</a>',
                    'fb': '<fb:like></fb:like>'
                }[options.service]) || ''
            });
        },
        
        /**
         * Данные шарринга для диалогового окна
         * @returns {{url: *, title: string}}
         * @protected
         */
        _getShareWindowData: function() {
            var service = this.getService();
            var encodedPageUrl = encodeURIComponent(this.__url);
            var url = croc.ui.social.Button.__SHARE_URLS[service].render({
                url: encodedPageUrl,
                countUrl: encodeURIComponent(this.__countUrl || this.__url),
                title: encodeURIComponent(this.getTitle())
            });
            
            var title;
            if (this.getTitle()) {
                title = encodeURIComponent(this.getTitle());
                url += service === 'vk' ? '&title=' + title :
                    service === 'fb' ? '&p[title]=' + title :
                        service === 'twitter' ? '&status=' + title + '+' + encodedPageUrl :
                            service === 'gplus' ? '&t=' + title : '';
            }
            else if (service === 'twitter') {
                url += '&status=' + encodedPageUrl;
            }
            
            if (this.__description) {
                var desc = encodeURIComponent(this.__description);
                url += service === 'vk' ? '&description=' + desc :
                    service === 'fb' ? '&p[summary]=' + desc :
                        service === 'odnoklassniki' ? '&st.comments=' + desc : '';
            }
            
            if (this.__image) {
                var img = encodeURIComponent(this.__image);
                url += service === 'vk' ? '&image=' + img :
                    service === 'fb' ? '&p[images][0]=' + img : '';
            }
            
            return {
                url: url,
                title: croc.util.Browser.isIE('<10') ? '' : (title || '')
            };
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.social.Button.superclass._initWidget.apply(this, arguments);
            
            $.Deferred().resolve()
                
                //todo убрать это (или дать возможность воспользоваться другим сервисом)
                .then(function() {
                    if (this.__shortenLink && this.__url) {
                        return stm.ajax({
                            url: 'shortlink.php',
                            data: {
                                url: this.__url
                            },
                            forceCache: true
                        })
                            .done(function(response) {
                                if (response.result) {
                                    this.__url = app.store.links.shortenerUrl + '/' + response.result;
                                }
                            }.bind(this));
                    }
                }.bind(this))
                
                .then(function() {
                    if (this.getAction() === 'like') {
                        this.__initLike();
                    }
                    else {
                        this.__initShare();
                    }
                }.bind(this));
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.social.Button.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (!this.getTitle()) {
                var ogTitle = $('meta[property="og:title"]').attr('content');
                if (ogTitle) {
                    this.setTitle(ogTitle);
                }
            }
            
            /**
             * @type {string}
             * @private
             */
            this.__countUrl = options.countUrl;
            
            /**
             * @type {string}
             * @private
             */
            this.__description = options.description;
            
            /**
             * @type {string}
             * @private
             */
            this.__image = options.image || $('meta[property="og:image"]').attr('content');
            
            /**
             * @type {boolean}
             * @private
             */
            this.__shortenLink = options.shortenLink;
            
            if (options.url) {
                this.setPage(options.url);
            }
            
            this.listenProperty('page', function(value) {
                if (value === 'this' && !this.getTitle() &&
                    (this.getService() === 'twitter' || this.getAction() === 'share')) {
                    this.setTitle(document.title);
                }
            }, this);
            
            if (this.getAction() !== 'share') {
                var forbidCallback = function() {
                    throw new Error('Нельзя менять свойства "title" и "page" для соц.кнопки с action!===share');
                };
                this.onChangeProperty('page', forbidCallback);
                this.onChangeProperty('title', forbidCallback);
            }
        },
        
        /**
         * Диалоговое окно шаринга
         * @returns {Window}
         * @protected
         */
        _open: function(windowData) {
            var width = croc.ui.social.Button.__SHARE_DIALOG_WIDTH;
            var height = croc.ui.social.Button.__SHARE_DIALOG_HEIGHT;
            var wLeft = window.screenLeft ? window.screenLeft : window.screenX;
            var wTop = window.screenTop ? window.screenTop : window.screenY;
            
            var left = wLeft + (window.innerWidth / 2) - (width / 2);
            var top = wTop + (window.innerHeight / 2) - (height / 2);
            
            // в ie8-9 не работает если в имени окна есть пробелы
            return window.open(windowData.url, windowData.title,
                'location' +
                ',width=' + width +
                ',height=' + height +
                ',top=' + top +
                ',left=' + left +
                ',screenX=' + left +
                ',screenY=' + top);
        },
        
        /**
         * @private
         */
        __initGplusLike: function() {
            this.__resources.loadScript('gplus').done(function() {
                //noinspection JSHint
                gapi.plusone.render(this.getElement()[0], {
                    size: 'medium',
                    href: this.__url,
                    callback: function(e) {
                        if (e.state === 'on') {
                            this.fireEvent('executed');
                        }
                    }.bind(this)
                });
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initFbLike: function() {
            var el = this.getElement().find('>*');
            el
                .attr('href', this.__url)
                .attr('width', 90)
                .attr('layout', 'button_count')
                .attr('show_faces', 'false')
                .attr('send', 'false');
            
            this.__resources.loadScript('facebook').done(function() {
                //noinspection JSHint
                FB.XFBML.parse(this.getElement()[0]);
                
                //noinspection JSHint
                FB.Event.subscribe('edge.create', function(url, curEl) {
                    if (curEl === el[0]) {
                        this.fireEvent('executed');
                    }
                }.bind(this));
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initLike: function() {
            switch (this.getService()) {
                case 'vk':
                    this.__initVkLike();
                    break;
                
                case 'twitter':
                    this.__initTwitterLike();
                    break;
                
                case 'gplus':
                    this.__initGplusLike();
                    break;
                
                case 'fb':
                    this.__initFbLike();
                    break;
                
                case 'odnoklassniki':
                    this.__initOdnoklassnikiLike();
                    break;
                
                default:
                    throw new Error('Неизвестный сервис для социальной кнопки!');
            }
        },
        
        /**
         * @private
         */
        __initShare: function() {
            var service = this.getService();
            var title = croc.ui.social.Button.__SHARE_DIALOG_TITLES[service];
            if (!title) {
                throw new Error('Неизвестный сервис для социальной кнопки: ' + service);
            }
            
            this.getElement().click(function(e) {
                this.fireEvent('click');
                this._open(this._getShareWindowData());
                e.preventDefault();
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initOdnoklassnikiLike: function() {
            this.__resources.loadScript('odnoklassniki').done(function() {
                var id = 'odnoklassniki-' + this.getUniqueId();
                
                this.getElement().attr('id', id);
                //noinspection JSHint
                OK.CONNECT.insertShareWidget(id, this.__url,
                    "{width:145,height:20,st:'rounded',sz:20,ck:1}");
                
                this._getDisposer().addListener($(window), 'message', function(e) {
                    var args = typeof e.originalEvent.data === 'string' && e.originalEvent.data.split('$');
                    if (args && args[0] === 'ok_shared' && args[1] === id) {
                        this.fireEvent('executed');
                    }
                }, this);
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initTwitterLike: function() {
            var anchorEl = this.getElement().find('>a');
            anchorEl
                .attr('data-lang', 'ru')
                .attr('data-counturl', this.__countUrl || this.__url)
                .attr('data-url', this.__url);
            
            if (this.getTitle()) {
                anchorEl.attr('data-text', this.getTitle());
            }
            
            this.__resources.loadScript('twitter').done(function() {
                //noinspection JSHint
                twttr.widgets.load();
                //noinspection JSHint
                twttr.events.bind('tweet', function(event) {
                    if (this.getElement().find('iframe')[0] === event.target) {
                        this.fireEvent('executed');
                    }
                }.bind(this));
            }.bind(this));
        },
        
        /**
         * @private
         */
        __initVkLike: function() {
            this.__resources.loadScript('vk').done(function() {
                var id = croc.utils.getStmId();
                this.getElement().attr('id', id);
                
                var conf = {
                    type: 'mini',
                    height: 20,
                    pageUrl: this.__url
                };
                
                if (this.getTitle()) {
                    conf.pageTitle = this.getTitle();
                }
                if (this.__description) {
                    conf.pageDescription = this.__description;
                }
                if (this.__image) {
                    conf.pageImage = this.__image;
                }
                
                this.__widgetId = VK.Widgets.Like(id, conf);
                
                VK.Observer.subscribe('widgets.like.liked', function(likes, id) {
                    if (this.__widgetId === id) {
                        this.fireEvent('executed');
                    }
                }.bind(this));
            }.bind(this));
        }
    }
});
