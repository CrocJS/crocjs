croc.ns('croc.ui.form.field');

/**
 * @extends {croc.ui.Container}
 *
 * @mixes {croc.ui.form.field.MStandardField}
 *
 * @implements {croc.ui.form.field.IField}
 * @implements {croc.ui.form.field.IDisable}
 * @implements {croc.ui.form.field.ITextField}
 * @implements {croc.ui.form.field.IUpdatableField}
 * @implements {croc.ui.form.field.ISizable}
 */
croc.ui.form.field.CardNumber = croc.extend(croc.ui.Container, {
    
    __TEMPLATE_COMPLEX_ITEM: '<div class="b-form-complex-cell js-wrapper">{item}</div>',
    
    /**
     * Заблокировано ли поле
     * @type {boolean}
     */
    disabled: false,
    
    /**
     * Шаблон по-умолчанию
     * @type {string}
     */
    htmlTemplate: '<div class="b-form-complex{cls}">{items}</div>',
    
    /**
     * Модификатор блока (css класс mod_...)
     * @type {string}
     */
    mod: 'cardnumber',
    
    /**
     * Значение текстового поля по-умолчанию
     * @type {string}
     */
    value: null,
    
    /**
     * см. {@link #getValidation}
     * @type {function|object|string}
     */
    validation: {
        required: true,
        length: 16
    },
    
    /**
     * Убрать фокус у элемента
     */
    blur: function() {
        this.getFieldElement().blur();
    },
    
    /**
     * Дать фокус элементу
     */
    focus: function() {},
    
    /**
     * Является ли поле недоступным
     * @returns {boolean}
     */
    getDisabled: function() {
        return this.disabled;
    },
    
    /**
     * Html-элемент поля
     * @returns {jQuery}
     */
    getFieldElement: function() {
        var els = $();
        this.getItems().forEach(function(item) {
            els = els.add(item.getFieldElement());
        });
        
        return els;
    },
    
    /**
     * Размер поля
     * @returns {string}
     */
    getSize: function() {
        return this.size;
    },
    
    /**
     * Пробелы на концах значения являются важными и их нельзя обрезать
     * @returns {boolean}
     */
    keepWhiteSpace: function() {
        return false;
    },
    
    /**
     * Изменить недоступность поля
     * @param {boolean} value
     */
    setDisabled: function(value) {
        this.getItems().forEach(function(item) {
            item.setDisabled(value);
        });
        this.disabled = value;
    },
    
    /**
     * Изменить состояние валидности поля
     * @param {boolean|null} valid
     */
    setValid: function(valid) {
        croc.ui.form.validation.MStandardValidatable.setValid.apply(this, arguments);
        
        this.getItems().forEach(function(item) {
            item.setValid(valid);
        });
    },
    
    /**
     * Изменить значение поля
     * @param {string} value
     */
    setValue: function(value) {
        var valueStr = value + '',
            count = 4;
        
        this.getItems().forEach(function(item, i) {
            item.setValue(valueStr.substr(i * count, count));
        });
    },
    
    /**
     * Инициализация виджета после его отрисовки в DOM
     * @return {$.Deferred|undefined}
     * @protected
     */
    _initWidget: function() {
        croc.ui.form.field.CardNumber.superclass._initWidget.call(this);
        
        if (this.isHtmlGenerated()) {
            this.setValue(this.getValue());
        }
        else {
            this.value = this.__getCollectValue();
        }
        
        this.getElement().find('.b-form-complex-cell input[type="text"]').groupinputs();
        
        this.getItems().forEach(function(item, i) {
            item.on('changeValue', function(value, oldValue) {
                this.value = this.__getCollectValue();
                this.fireEvent('update', this.value, i);
            }, this);
        }.bind(this));
        
        croc.utils.domSetModifier(this.getElement(), 'size', this.getSize());
    },
    
    /**
     * Шаблон для обрамления дочернего элемента. Должен присутствовать маркер {item}.
     * @param {string} section
     * @param {croc.ui.Widget} item дочерний виджет
     * @returns {string}
     * @protected
     */
    _getItemWrapperTemplate: function(section, item) {
        return this.__TEMPLATE_COMPLEX_ITEM;
    },
    
    /**
     * Поиск элементов DOM для всех дочерних элементов
     * @param {jQuery} el
     * @return {Object.<string, jQuery>}
     * @protected
     */
    _scanForItemsElements: function(el) {
        return {
            items: el.find('.b-form-complex-cell > .b-input')
        };
    },
    
    /**
     * Выполняется когда свойства виджета уже инициализированы
     * @protected
     */
    _onPropertiesInitialized: function() {
        croc.ui.form.field.CardNumber.superclass._onPropertiesInitialized.apply(this, arguments);
        
        if (!this.identifier && this.getElement()) {
            this.identifier = this.getElement().find('input[type=text]:eq(0)').attr('name');
            if (this.identifier) {
                this.identifier = this.identifier.replace('[]', '');
            }
        }
        
        if (!this.size && this.getElement()) {
            this.size = parseInt(this.getElement().attr('class').match(/size_([0-9])/)[1], 10) || 1;
        }
        
        var itemCfg;
        for (var i = 0; i < 4; i++) {
            itemCfg = {
                xtype: croc.ui.form.field.TextField,
                showAction: false,
                transformOnUpdate: 'digitsOnly',
                maxLength: 4
            };
            
            if (!this.getElement()) {
                itemCfg.size = this.getSize();
                itemCfg.name = this.identifier + '[]';
                itemCfg.disableAutocomplete = true;
            }
            
            this.items.items.push(itemCfg);
        }
    },
    
    /**
     * @returns {string}
     * @private
     */
    __getCollectValue: function() {
        var value = '';
        
        this.getItems().forEach(function(textfield) {
            value += textfield.getValue();
        }.bind(this));
        
        return value.replace(/[^0-9]+/, '');
    }
    
});

croc.implement(croc.ui.form.field.CardNumber,
    croc.ui.form.field.IDisable,
    croc.ui.form.field.ISizable,
    croc.ui.form.field.ITextField,
    croc.ui.form.field.IUpdatableField);

croc.mix(croc.ui.form.field.CardNumber,
    croc.ui.form.field.MStandardField);

croc.ui.WidgetsManager.getInstance().registerAlias(croc.ui.form.field.CardNumber, 'croc.ui.form.field.CardNumber');

