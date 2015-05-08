/**
 * Переключаемый набор кнопок
 * Для полноценной работы в качестве поля формы нужна доработка!
 * todo при внедрении все упоминания перевести в хелпер
 */
croc.Class.define('croc.ui.form.field.RadioButtonsSet', {
    extend: croc.ui.Container,
    include: croc.ui.form.field.MStandardField,
    implement: [
        croc.ui.form.field.IField,
        croc.ui.form.field.ISizable,
        croc.ui.form.field.IDisable
    ],
    
    properties: {
        /**
         * Блокировка поля
         * @type {boolean}
         */
        disabled: {
            type: 'boolean',
            value: false,
            apply: function(value) {
                this._options.dItemDefaults.disabled = value;
                this.getItems().forEach(function(button) {
                    button.setDisabled(value);
                });
            },
            option: true
        },
        
        /**
         * Размер поля
         * @type {string}
         */
        size: {
            type: 'string',
            __setter: null,
            value: '2',
            apply: function(value) {
                this._options.dItemDefaults.size = value;
            },
            option: true
        },
        
        value: {
            apply: function(value, old, dontSwitchButtons) {
                if (!dontSwitchButtons && this.getRendered() && this.getItems()) {
                    this.getItems().forEach(function(button) {
                        button.setActive(this.__getButtonValue(button) === value);
                    }, this);
                }
            },
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * алиас к itemsDefaults[defSection], где defSection - секция по-умолчанию
         * @type {Object}
         */
        dItemDefaults: {
            value: {
                xtype: croc.ui.form.Button
            }
        },
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '<div class="b-sbutton-set spacing_0{cls}">{items}</div>',
        
        /**
         * Повторное нажатие на зажатую кнопку приводит к обнулению свитчера
         * @type {boolean}
         */
        nullable: {},
        
        /**
         * Значение набора
         * @type {string}
         */
        value: {},
        
        /**
         * value|identifier
         * @type {string}
         */
        valueSource: 'value'
    },
    
    members: {
        /**
         * Возвращает индекс активной кнопки
         * @returns {number}
         */
        getActiveButtonIndex: function() {
            return !this.getValue() ? -1 : _.findIndex(this.getItems(), function(x){return x.getActive();});
        },
        
        /**
         * Инициализация виджета после его отрисовки в DOM
         * @return {$.Deferred|undefined}
         * @protected
         */
        _initWidget: function() {
            croc.ui.form.field.RadioButtonsSet.superclass._initWidget.call(this);
            
            this.getItems().forEach(function(button) {
                button.on('execute', function() {
                    var buttonValue = this.__getButtonValue(button);
                    this.setValue(this._options.nullable && buttonValue === this.getValue() ? null : buttonValue);
                }, this);
            }, this);
        },
        
        /**
         * Метод вызывается при добавлении нового дочернего элемента
         * @param {string} section
         * @param {croc.ui.Widget} item
         * @protected
         */
        _onAddItem: function(section, item) {
            var value = this.__getButtonValue(item);
            if (value && this.getValue() === value) {
                item.setActive(true);
            }
            if (item.getActive()) {
                this.setValue(value);
            }
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.form.field.RadioButtonsSet.superclass._onPropertiesInitialized.apply(this, arguments);
            _.assign(this._options.dItemDefaults, {
                size: this.getSize(),
                disabled: this.getDisabled()
            });
        },
        
        /**
         * Поиск элементов DOM для всех дочерних элементов
         * @param {jQuery} el
         * @return {Object.<string, jQuery>}
         * @protected
         */
        _scanForItemsElements: function(el) {
            return {
                items: el.children()
            };
        },
        
        /**
         * Изменить элемент ещё не вставленный в DOM корневой элемент
         * @param {jQuery} el
         * @protected
         */
        _transformElement: function(el) {
            croc.ui.form.field.RadioButtonsSet.superclass._transformElement.apply(this, arguments);
            
            var buttons = this._scanForItemsElements(el).items;
            if (buttons.length > 1) {
                buttons.first().addClass('round_left');
                buttons.last().addClass('round_right');
            }
            else {
                buttons.addClass('round_both');
            }
        },
        
        /**
         * @param {croc.ui.form.Button} button
         * @returns {string}
         * @private
         */
        __getButtonValue: function(button) {
            return button[croc.Object.getPropertyPart('get', this._options.valueSource)]();
        }
    }
});