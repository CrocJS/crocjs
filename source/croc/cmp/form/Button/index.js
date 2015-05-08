/**
 * Кнопка
 */
croc.Class.define('croc.cmp.form.Button', {
    extend: croc.cmp.Widget,
    
    events: {
        /**
         * Кнопка была нажата
         */
        click: null
    },
    
    properties: {
        /**
         * активна ли кнопка
         * @type {boolean}
         */
        active: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * Заблокирована ли кнопка
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * Кнопка в состоянии загрузки
         * @type {boolean}
         */
        loading: {
            type: 'boolean',
            value: false,
            model: true
        },
        
        /**
         * Набор кнопок
         * @type {string}
         */
        'set': {
            type: 'string',
            value: 'system',
            model: true
        },
        
        /**
         * Цветовая схема кнопки
         * @type {string}
         */
        scheme: {
            type: 'string',
            value: 'gray',
            model: true
        },
        
        /**
         * Размер кнопки
         * @type {string}
         */
        size: {
            type: 'string',
            value: '2',
            model: true
        },
        
        /**
         * Текст кнопки, если не задан, то равен value
         * @type {string}
         */
        text: {
            type: 'string',
            model: true
        },
        
        /**
         * Атрибут value кнопки
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
        
        /**
         * Предотвратить стандартное поведение кнопки (sumbit формы)
         * @type {boolean}
         */
        preventDefault: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Радиокнопка - при клике меняется свойство active
         * @type {boolean}
         */
        radio: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Предотвратить всплывание события mousedown и click
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
         * insert b-sbutton-text-h
         * @type {boolean}
         */
        textHelper: {},
        
        /**
         * Тип кнопки: button, submit
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
         * Тип кнопки
         * @return {string}
         */
        getType: function() {
            return this.__type;
        }
    }
});

croc.services.Resources.loadImage('/croc/images/blocks/b-sbutton/state_loading.gif', true);