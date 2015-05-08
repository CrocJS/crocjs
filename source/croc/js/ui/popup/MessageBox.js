/**
 * Попап выбора действия пользователя
 */
croc.Class.define('croc.ui.popup.MessageBox', {
    extend: croc.ui.popup.Popup,
    
    events: {
        /**
         * Продолжить выполнение действие
         */
        accept: null,
        
        /**
         * Отменить выполнение дейсвтия
         */
        cancel: null
    },
    
    options: {
        /**
         * Текст кнопки продолжения выполнения дейсвтия описанного в сообщении
         * @type {String}
         */
        acceptButton: 'Да',
        
        /**
         * Текст кнопки отказа от действия описанного в сообщении
         * @type {String}
         */
        cancelButton: 'Нет',
        
        /**
         * Содержимое попапа
         * @type {string}
         */
        content: '' +
        '<div>' +
        '    <p class="g-font size_7 g-ui margin_050">{title}</p>' +
        '    <p>{text}</p>' +
        '    <div class="b-messagebox-foot">' +
        '        <div class="b-sbutton-set spacing_1">' +
        '            <span class="b-sbutton set_system scheme_gray size_2 box_minimal js-messageBoxPopup-accept">' +
        '                <span class="b-sbutton-text">{acceptButton}</span>' +
        '            </span>' +
        '            <span class="b-sbutton set_system scheme_gray size_2 box_minimal js-messageBoxPopup-cancel">' +
        '                <span class="b-sbutton-text">{cancelButton}</span>' +
        '            </span>' +
        '        </div>' +
        '    </div>' +
        '</div>',
        
        /**
         * Дополнительные классы для блока через пробел
         * @type {String}
         */
        extraCls: 'set_messagebox',
        
        /**
         * Идентификатор виджета, по которому будет осуществляться поиск дочерних элементов и субэлементов
         * @type {string}
         */
        hostId: 'messageBoxPopup',
        
        /**
         * Скин
         * @type {string}
         */
        skin: 'mini',
        
        /**
         * Подробный текст сообщения дейсвтия
         * @type {String}
         */
        text: null,
        
        /**
         * @see mod
         * @type {String}
         */
        type: {
            check: ['confirm'],
            value: 'confirm'
        }
    },
    
    members: {
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.popup.MessageBox.superclass._initWidget.apply(this, arguments);
            
            this.getSubElement('accept').on('click', function() {
                this.__eventName = 'accept';
                this.close();
            }.bind(this));
            
            var cancel = this.getSubElement('cancel');
            if (this.__cancelButton) {
                cancel.on('click', function() {
                    this.close();
                }.bind(this));
            }
            else {
                cancel.remove();
            }
            
            this.on('close', function() {
                this.fireEvent(this.__eventName);
            }, this);
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            this.__cancelButton = options.cancelButton;
            this.__eventName = 'cancel';
            
            if (options.type) {
                options.extraCls += ' type_' + options.type;
            }
            
            options.content = options.content.render({
                acceptButton: options.acceptButton,
                cancelButton: options.cancelButton,
                text: options.text || '',
                title: this.getTitle()
            });
            this.setTitle(null);
            
            croc.ui.popup.MessageBox.superclass._onPropertiesInitialized.apply(this, arguments);
        }
    }
});