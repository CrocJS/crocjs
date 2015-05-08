/**
 * Системное уведомление
 */
croc.Class.define('croc.ui.notifications.Notification', {
    extend: croc.ui.Widget,
    
    properties: {
        /**
         * Время показа уведомления. Свойство используется менеджером.
         * @type {number}
         */
        time: {
            type: 'number',
            option: true
        },
        
        /**
         * Тип уведомления
         * @type {string}
         */
        type: {
            cssClass: true,
            check: ['error', 'warning', 'info'],
            value: 'info',
            __getter: null,
            __setter: null,
            option: true
        }
    },
    
    options: {
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '' +
        '<div class="b-notification{cls}">' +
        '   <div class="b-notification-side">' +
        '       <div class="b-notification-side-icon"></div>' +
        '   </div>' +
        '   {text}' +
        '</div>',
        
        /**
         * Элемент-контейнер виджета. Передаётся если разметка виджета должна быть создана динамически.
         * @type {string|Element|jQuery}
         */
        renderTo: 'body',
        
        /**
         * Виден ли виджет после его рендеринга
         * @type {boolean}
         */
        shown: false,
        
        /**
         * Текст уведомление (может содержать html)
         * @type {string}
         * @required
         */
        text: null,
        
        /**
         * Ширина виджета
         * @type {number|string}
         */
        width: 260
    },
    
    members: {
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.notifications.Notification.superclass._getAddRenderData.apply(this, arguments), {
                text: options.text
            });
        }
    }
});
