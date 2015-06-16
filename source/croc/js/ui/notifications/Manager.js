/**
 * Менеджер системных уведомлений
 */
croc.Class.define('croc.ui.notifications.Manager', {
    extend: croc.Object,
    
    statics: {
        /**
         * Получить общую для приложения инстанцию менеджера
         * @returns {croc.ui.notifications.Manager}
         */
        getInstance: function() {
            return this.__instance || (this.__instance = new croc.ui.notifications.Manager());
        },
        
        /**
         * Показать системное уведомление
         * @param {string} message
         * @param {string} [type='info'] info|warning|error
         * @param {number} [time]
         */
        showNotification: function(message, type, time) {
            this.getInstance().addNotification(new croc.ui.notifications.Notification({
                type: type || 'info',
                text: message,
                time: time || null
            }));
        }
    },
    
    options: {
        /**
         * Время сокрытия уведомления
         * @type {number}
         */
        hidingTime: 300,
        
        /**
         * Минимальное время между сокрытиями двух уведомлений
         * @type {number}
         */
        hidingTimePause: 100,
        
        /**
         * Расстояние между двумя уведомлениями
         * @type {number}
         */
        notificationsGap: 5,
        
        /**
         * Время показа уведомления
         * @type {number}
         */
        notificationTime: 2000,
        
        /**
         * Время появления уведомления
         * @type {number}
         */
        showingTime: 300,
        
        /**
         * Расстояние сверху экрана до первого сверху уведомления
         * @type {number}
         */
        topGap: 5
    },
    
    construct: function(options) {
        this.__notifications = [];
        this.__queue = [];
        this.__hideQueue = [];
        this.__bottom = options.topGap;
        this.__hideAnimation = false;
        this.__hidingTime = options.hidingTime;
        this.__hidingTimePause = options.hidingTimePause;
        this.__notificationsGap = options.notificationsGap;
        this.__notificationTime = options.notificationTime;
        this.__showingTime = options.showingTime;
        
        croc.ui.notifications.Manager.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Добавить уведомление
         * @param {croc.ui.notifications.Notification} notification
         */
        addNotification: function(notification) {
            var el = notification.getElement();
            el.css({opacity: 0});
            notification.setShown(true);
            var nextBottom = this.__bottom + el.outerHeight() + this.__notificationsGap;
            
            if (this.__hideAnimation || nextBottom > $(window).height()) {
                this.__queue.push(notification);
                return;
            }
            this.__notifications.push(notification);
            
            el.css({
                top: this.__bottom,
                right: '50%',
                marginRight: -Math.floor(el.outerWidth() / 2)
            });
            
            this.__bottom = nextBottom;
            el.animate({opacity: 1}, this.__showingTime, function() {
                this._getDisposer().setTimeout(function() {
                    this.__hide(notification);
                }.bind(this), notification.getTime() || this.__notificationTime);
            }.bind(this));
            
            if (this.__queue[0] === notification) {
                this.__queue.shift();
            }
        },
        
        /**
         * @param {croc.ui.notifications.Notification} notification
         * @private
         */
        __hide: function(notification) {
            if (this.__hideAnimation || this.__notifications[0] !== notification) {
                this.__hideQueue.push(notification);
                return;
            }
            
            var el = notification.getElement();
            var deltaHeight = el.outerHeight() + this.__notificationsGap;
            this.__bottom -= deltaHeight;
            
            this.__notifications.forEach(function(curNotification, i) {
                var conf = {top: '-=' + deltaHeight};
                if (i === 0) {
                    conf.opacity = 0;
                }
                curNotification.getElement().animate(conf, {
                    duration: this.__hidingTime,
                    queue: false
                });
            }, this);
            
            this.__hideAnimation = true;
            this._getDisposer().setTimeout(function() {
                this.__hideAnimation = false;
                notification.destroy();
                
                if (this.__queue.length) {
                    this.addNotification(this.__queue[0]);
                }
                
                if (this.__hideQueue.length) {
                    this._getDisposer().setTimeout(function() {
                        this.__hide(this.__hideQueue[0]);
                    }.bind(this), this.__hidingTimePause);
                }
            }.bind(this), this.__hidingTime);
            
            this.__notifications.shift();
            if (this.__hideQueue[0] === notification) {
                this.__hideQueue.shift();
            }
        }
    }
});

croc.services.Resources.loadImage('/croc/images/blocks/b-notification/icons-sprite.png', true);
