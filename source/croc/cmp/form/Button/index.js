/**
 * api-ru Кнопка
 * api-en Button.
 */
croc.Class.define('croc.cmp.form.Button', {
    extend: croc.cmp.Widget,
    
    events: {
        /**
         * api-ru Кнопка была нажата
         * api-en Button was clicked.
         */
        click: null
    },
    
    properties: {
        /**
         * api-ru активна ли кнопка
         * api-en Is button active?
         * @type {boolean}
         */
        active: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * api-ru Заблокирована ли кнопка
         * api-en Is button blocked?
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * api-ru Кнопка в состоянии загрузки
         * api-en Button is in downloading state. 
         * @type {boolean}
         */
        loading: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * api-ru Набор кнопок
         * api-en Buttons set.
         * @type {string}
         */
        'set': {
            type: 'string',
            value: 'system',
            model: true
        },
        
        /**
         * api-ru Цветовая схема кнопки
         * api-en Button colot scheme.
         * @type {string}
         */
        scheme: {
            type: 'string',
            value: 'gray',
            model: true
        },
        
        /**
         * api-ru Размер кнопки
         * api-en Button size.
         * @type {string}
         */
        size: {
            type: 'string',
            value: '2',
            model: true
        },
        
        /**
         * api-ru Текст кнопки, если не задан, то равен value
         * api-en Button text, if it's not set, than equal to value.
         * @type {string}
         */
        text: {
            type: 'string',
            model: true
        },
        
        /**
         * api-ru Атрибут value кнопки
         * api-en Button value attribute.
         * @type {string}
         */
        value: {
            type: 'string',
            model: true
        }
    },
    
    options: {
        /**
         * Custom button (with custom class and content)
         */
        custom: false,
        
        href: {},
        
        /**
         * api-ru Предотвратить стандартное поведение кнопки (sumbit формы)
         * api-en Prevent standard button action (form submit)
         * @type {boolean}
         */
        preventDefault: {
            type: 'boolean',
            value: false
        },
        
        /**
         * api-ru Радиокнопка - при клике меняется свойство active
         * api-en Radiobutton - changes active property on click.
         * @type {boolean}
         */
        radio: {
            type: 'boolean',
            value: false
        },
        
        /**
         * api-ru Предотвратить всплывание события mousedown и click
         * api-en Prevent bubbling event by mousedown and click.
         * @type {boolean}
         */
        stopPropagation: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Button tag
         */
        tag: 'span',
        
        /**
         * api-ru Тип кнопки: button, submit
         * api-en Button type: button, submit.
         * @type {string}
         */
        type: {
            check: ['button', 'submit']
        }
    },
    
    members: {
        click: function() {
            if (!this.getDisabled() && !this.getLoading()) {
                if (this._options.radio) {
                    this.setActive(!this.getActive());
                }
                this.fireEvent('click');
                return true;
            }
            return false;
        },
        
        /**
         * api-ru Тип кнопки
         * api-en Button type.
         * @return {string}
         */
        getType: function() {
            return this.__type;
        },
        
        /**
         * Инициализация модели виджета
         * @protected
         */
        _initModel: function() {
            croc.cmp.form.Button.superclass._initModel.apply(this, arguments);
            this._options.tag = this._options.href ? 'a' : this._options.type ? 'input' : this._options.tag;
        }
    }
});

croc.services.Resources.loadImage('/croc/images/blocks/b-sbutton/state_loading.gif', true);