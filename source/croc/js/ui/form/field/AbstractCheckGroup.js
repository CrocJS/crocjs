croc.ns('croc.ui.form.field');

/**
 * Группа чекбоксов/радиокнопок
 * Дочерний виджет может содержать мета данные:
 * label: string
 * inline: boolean
 *
 * @abstract
 * @extends {croc.ui.Container}
 * @mixes {croc.ui.form.field.MStandardField}
 * @implements {croc.ui.form.field.IField}
 * @implements {croc.ui.form.field.ISizable}
 * @implements {croc.ui.form.field.IDisable}
 * @event changeValue (value: *, oldValue: *) значение поля было изменено программно, либо после потери фокуса
 */
croc.ui.form.field.AbstractCheckGroup = croc.extend(croc.ui.Container, {
    
    __TEMPLATE_CHECK_BUTTONS_GROUP: [
        '<div class="b-form-group dir_{dir} type_{type}{cls}">',
        '   {items}',
        '</div>'
    ].join(''),
    
    __TEMPLATE_CHECK_BUTTON_WRAPPER: [
        '<div class="b-form-check size_{size} js-wrapper">',
        '   <label class="g-ui cursor_pointer">{item} {label}</label>',
        '</div>'
    ].join(''),
    
    /**
     * Отметить первую кнопку в группе, если ни одна не отмечена
     * @type {boolean}
     */
    checkFirst: false,
    
    /**
     * Заблокировано ли поле
     * @type {boolean}
     */
    disabled: false,
    
    /**
     * Должны ли кнопки идти в ряд. true - соответствует dir_ttb, false - dir_ltr
     * @type {boolean}
     */
    inline: false,
    
    /**
     * Конфигурация по-умолчанию добавляемая к items
     * @type {Object.<string, object>|object}
     */
    itemDefaults: {
        items: {}
    },
    
    /**
     * Искать все радиокнопки/чекбоксы внутри элемента, не придерживаясь строгой структуры
     * @type {boolean}
     */
    lookForAllCheckButtons: false,
    
    /**
     * мета-данные для добавления дочернего виджета
     * @type {object}
     */
    meta: {
        openTooltipAnyway: true
    },
    
    /**
     * Размер дочерних кнопок
     * @type {string}
     */
    size: null,
    
    /**
     * тип группы
     * @type {string}
     */
    type: null,
    
    /**
     * Является ли поле недоступным
     * @returns {boolean}
     */
    getDisabled: function() {
        return this.disabled;
    },
    
    /**
     * Размер дочерних кнопок
     * @return {string}
     */
    getSize: function() {
        return this.size;
    },
    
    /**
     * Значение поля
     * @return {*}
     */
    getValue: function() {
        return this.value;
    },
    
    /**
     * Возвращает true если кнопки выстроены в линию
     * @returns {boolean}
     */
    isInline: function() {
        return this.inline;
    },
    
    /**
     * Изменить недоступность поля
     * @param {boolean} value
     */
    setDisabled: function(value) {
        $.each(this.getItems(), function(i, button) {
            button.setDisabled(value);
        });
        this.getElement().toggleClass('state_disabled', value);
        this.disabled = value;
    },
    
    /**
     * Изменить размер дочерних кнопок
     * @param {string} size
     */
    setSize: function(size) {
        this.size = size;
        this.itemDefaults.items.size = size;
    },
    
    /**
     * Изменить значение поля
     * @param {*} value
     */
    setValue: function(value) {
        if (this.value !== value) {
            var oldValue = this.value;
            this._setValueInternal(value);
            this._doSetValue(value);
            this.fireEvent('changeValue', value, oldValue);
        }
    },
    
    /**
     * Изменение значения группы
     * @param value
     * @protected
     */
    _doSetValue: function(value) { throw 'abstract!'; },
    
    /**
     * Дополнительные данные для рендеринга из шаблона
     * @param {Object} options
     * @returns {object}
     * @protected
     */
    _getAddRenderData: function(options) {
        return _.assign(croc.ui.form.field.AbstractCheckGroup.superclass._getAddRenderData.apply(this, arguments), {
            dir: this.dir,
            type: options.type
        });
    },
    
    /**
     * Изменение значения группы
     * @returns {string}
     * @protected
     */
    _getButtonClass: function() { throw 'abstract!'; },
    
    /**
     * Шаблон для обрамления дочернего элемента. Должен присутствовать маркер {item}.
     * @param {string} section
     * @param {croc.ui.Widget} item дочерний виджет
     * @returns {string}
     * @protected
     */
    _getItemWrapperTemplate: function(section, item) {
        var field = /** @type {croc.ui.form.field.AbstractCheckButton} */(item);
        return this.__TEMPLATE_CHECK_BUTTON_WRAPPER.render({
            label: item.getMeta().label || '',
            size: field.getSize()
        });
    },
    
    /**
     * Шаблон для элемента
     * @return {$.Deferred|string}
     * @protected
     */
    _getTemplate: function() {
        return this.__TEMPLATE_CHECK_BUTTONS_GROUP;
    },
    
    /**
     * Инициализация виджета после его отрисовки в DOM
     * @return {$.Deferred|undefined}
     * @protected
     */
    _initWidget: function() {
        croc.ui.form.field.AbstractCheckGroup.superclass._initWidget.call(this);
        if (this.value) {
            this.setValue(this.value);
        }
        
        if (this.checkFirst && !this.getValue() && this.getItems().length) {
            this.getItems()[0].setChecked(true);
        }
        
        if (this.disabled) {
            this.setDisabled(true);
        }
    },
    
    /**
     * Вставить дочерний элемент в определённую секцию
     * @param {string} section
     * @param {jQuery} elements
     * @param {jQuery} beforeElement
     * @param {Array.<croc.ui.Widget>} widgets
     * @protected
     */
    _insertItems: function(section, elements, beforeElement, widgets) {
        if (beforeElement) {
            beforeElement.closest('.b-form-check').before(elements);
        }
        else {
            this.getElement().append(elements);
        }
    },
    
    /**
     * Метод вызывается при добавлении нового дочернего элемента
     * @param {string} section
     * @param {croc.ui.Widget} item
     * @protected
     */
    _onAddItem: function(section, item) {
        if (section === 'items') {
            var field = /** @type {croc.ui.form.field.RadioButton} */(item);
            if (!this.size) {
                this.setSize(field.getSize());
            }
        }
    },
    
    /**
     * Выполняется когда свойства виджета уже инициализированы
     * @protected
     */
    _onPropertiesInitialized: function() {
        croc.ui.form.field.AbstractCheckGroup.superclass._onPropertiesInitialized.apply(this, arguments);
        
        if (this.size) {
            this.setSize(this.size);
        }
        
        this.dir = this.inline ? 'ltr' : 'ttb';
        
        if (this.getElement()) {
            this.inline = this.getElement().hasClass('dir_ltr');
        }
    },
    
    /**
     * Удалить дочерний элемент
     * @param {croc.ui.Widget} item
     * @protected
     */
    _removeItemElement: function(item) {
        item.getElement().closest('.b-form-check').remove();
    },
    
    /**
     * Поиск элементов DOM для всех дочерних элементов
     * @param {jQuery} el
     * @return {Object.<string, jQuery>}
     * @protected
     */
    _scanForItemsElements: function(el) {
        return {
            items: el.find(this.lookForAllCheckButtons ?
            '.' + this._getButtonClass() : '>.b-form-check>label>.' + this._getButtonClass())
        };
    },
    
    /**
     * @param value
     * @protected
     */
    _setValueInternal: function(value) {
        this.value = value;
    }
});

croc.implement(croc.ui.form.field.AbstractCheckGroup,
    croc.ui.form.field.IField,
    croc.ui.form.field.ISizable,
    croc.ui.form.field.IDisable);

croc.mix(croc.ui.form.field.AbstractCheckGroup,
    croc.ui.form.field.MStandardField);
