croc.ns('croc.ui.form.validation');

/**
 * Класс отвечает за появление уведомлений о полях не прошедших валидацию
 * @extends {croc.Object}
 */
croc.ui.form.validation.Notifier = croc.extend(croc.Object, {
    
    /**
     * @type {croc.ui.form.validation.Manager}
     */
    validationManager: null,
    
    /**
     * Позиция всплывающих подсказок (left, right, top, bottom)
     * @type {string}
     */
    tooltipPosition: 'right',
    
    init: function() {
        this.__tooltipAutoOpen = true;
        this.__bubbleManager = new croc.ui.common.bubble.Manager({
            closeBehavior: 'permanent'
        });
        
        this.validationManager.on({
            itemAdded: this.__onItemAdded,
            itemValidated: this.__onItemValidated,
            itemRemoved: this.__onItemRemoved
        }, this);
    },
    
    /**
     * Закрыть все подсказки
     * @param {croc.ui.form.validation.IValidatable} [exceptItem=null] кроме подсказки для этого элемента
     */
    closeTooltips: function(exceptItem) {
        this.__bubbleManager.closeAll(this.getUserData(exceptItem).tooltip);
    },
    
    /**
     * Очищение объекта перед разрушением
     */
    dispose: function() {
        croc.ui.form.validation.Notifier.superclass.dispose.apply(this, arguments);
        this.__bubbleManager.dispose();
    },
    
    /**
     * Не показывать тултип для элемента
     * @param {croc.ui.form.validation.IValidatable} item
     */
    offTooltip: function(item) {
        var data = this.getUserData(item);
        data.disableTooltip = true;
        if (data.tooltip) {
            data.tooltip.destroy();
            delete data.tooltip;
        }
    },
    
    /**
     * Обновить положение всех тултипов
     */
    repositionTooltips: function() {
        this.__bubbleManager.repositionAll();
    },
    
    /**
     * Нужно ли автоматически показывать тултип после валидации поля
     * @param {boolean} value
     */
    setTooltipAutoOpen: function(value) {
        this.__tooltipAutoOpen = value;
    },
    
    /**
     * Назначить конфигурацию для тултипа. В конфигурации можно указать секцию meta с ключами:
     * openAnyway - тултип автоматически всплывает после валидации даже если всплытие запрещено методом setTooltipAutoOpen
     * @param {croc.ui.form.validation.IValidatable} item
     * @param {Object} conf
     */
    setTooltipConf: function(item, conf) {
        var data = this.getUserData(item);
        data.tooltipConf = conf;
        if (data.tooltip) {
            this.__onItemValidated(item);
        }
    },
    
    /**
     * @param {croc.ui.form.validation.IValidatable} item
     * @returns {Object}
     * @private
     */
    __getItemMeta: function(item) {
        return item instanceof croc.ui.Widget ? item.getMeta() : {};
    },
    
    /**
     * @param {croc.ui.form.validation.IValidatable} item
     * @param {croc.ui.tooltip.Tooltip} tooltip
     * @returns {jQuery|Array}
     * @private
     */
    __getTooltipTarget: function(item, tooltip) {
        var constrId = croc.utils.objUniqueId(item.constructor);
        if (croc.ui.form.validation.Notifier.__tooltipTargets[constrId]) {
            return croc.ui.form.validation.Notifier.__tooltipTargets[constrId](item, tooltip);
        }
        
        var el = item.getElement();
        var row = el.closest('.b-form-row');
        var leftLabel = row.hasClass('pos_left') && row.find('.b-form-label.pos_left>label');
        if (!leftLabel.length) {
            leftLabel = null;
        }
        var topLabel = row.hasClass('pos_top') && row.find('.b-form-label.pos_top>label');
        if (!topLabel.length) {
            topLabel = null;
        }
        var curTooltipPos = tooltip.getCurrentPosition();
        
        var tooltipLeft = curTooltipPos === 'left';
        
        if (tooltipLeft && leftLabel) {
            return leftLabel;
        }
        
        if (curTooltipPos === 'top' && topLabel) {
            return topLabel;
        }
        
        if (item instanceof croc.ui.form.Form && item.getSubmitButton()) {
            return item.getSubmitButton().getElement();
        }
        
        var formComboWrapper = el.parents('.b-form-complex:eq(0)');
        if (formComboWrapper.length > 0) {
            if (curTooltipPos === 'right' || curTooltipPos === 'left') {
                var elOffsetTop = el.offset().top;
                var comboOffsetLeft = formComboWrapper.offset().left;
                return [
                    [comboOffsetLeft, elOffsetTop],
                    [comboOffsetLeft + formComboWrapper.outerWidth(), elOffsetTop + el.outerHeight()]
                ];
            }
        }
        
        if (croc.Class.check(item, 'croc.ui.form.field.CheckBox')) {
            var checkLabel = el.closest('.b-form-check>label');
            if (checkLabel.length) {
                return checkLabel.add(el);
            }
        }
        
        if (croc.Class.check(item, 'croc.ui.form.field.AbstractCheckGroup')) {
            return el.find('.b-input-' +
            (croc.Class.check(item, 'croc.ui.form.field.CheckBoxesGroup') ? 'checkbox' : 'radio') +
            ',>.b-form-check>label');
        }
        
        if (!tooltipLeft && (croc.Class.check(item, 'croc.ui.form.field.AbstractLinkField') ||
            croc.Class.check(item, 'croc.ui.form.field.LinkSelect'))) {
            return item.getTextElement();
        }
        
        return el;
    },
    
    /**
     * @param {croc.ui.form.validation.IValidatable} item
     * @returns {jQuery}
     * @private
     */
    __getTooltipTrigger: function(item) {
        if (croc.Class.check(item, 'croc.ui.form.field.CheckBox')) {
            var checkLabel = item.getElement().closest('.b-form-check>label');
            if (checkLabel.length) {
                return checkLabel.add(item.getElement());
            }
        }
        
        return item.getElement();
    },
    
    /**
     * @private
     */
    __onItemAdded: function(item) {
        if (this.__getItemMeta(item).offTooltip) {
            this.offTooltip(item);
        }
        this.repositionTooltips();
    },
    
    /**
     * @param {croc.ui.form.validation.IValidatable} item
     * @private
     */
    __onItemRemoved: function(item) {
        var data = this.getUserData(item);
        if (data.tooltip) {
            data.tooltip.destroy();
            delete data.tooltip;
        }
        
        this.repositionTooltips();
    },
    
    /**
     * @param {croc.ui.form.validation.IValidatable} item
     * @private
     */
    __onItemValidated: function(item) {
        var data = this.getUserData(item);
        
        var tooltip = data.tooltip;
        
        if (tooltip) {
            tooltip.destroy();
            delete data.tooltip;
        }
        
        if (data.disableTooltip || !item.getInvalidMessage() || item.getValid() !== false) {
            return;
        }
        
        var conf = _.assign({}, croc.ui.form.validation.Notifier.TOOLTIP_CONFIG, {
            content: item.getInvalidMessage(),
            position: this.tooltipPosition,
            controlWidget: croc.ui.WidgetsManager.getPageWidget(),
            opener: item.getElement(),
            manager: this.__bubbleManager,
            newDesign: false
        }, data.tooltipConf || {});
        
        if (!conf.target) {
            conf.target = function(tooltip) {
                return this.__getTooltipTarget(item, tooltip);
            }.bind(this);
        }
        
        if (!conf.trigger) {
            conf.trigger = this.__getTooltipTrigger(item);
        }
        
        tooltip = data.tooltip = new croc.ui.tooltip.Tooltip(conf);
        
        //todo перенести в стили
        tooltip.listenProperty('rendered', function(value) {
            if (value) {
                tooltip.getBodyElement().css('padding', '6px 9px');
            }
        });
        
        var meta = this.__getItemMeta(item);
        var autoOpen = this.__tooltipAutoOpen || meta.openTooltipAnyway;
        
        if (autoOpen) {
            this._getDisposer().setTimeout(function() {
                if (autoOpen && !tooltip.isDisposed()) {
                    this.__bubbleManager.openUnmanageable(tooltip);
                }
            }.bind(this), 250);
        }
    }
});

/**
 *
 * Стандартный конфиг для тултипа уведомления об ошибке
 * @type {Object}
 */
croc.ui.form.validation.Notifier.TOOLTIP_CONFIG = {
    scheme: 'red',
    position: 'right',
    autoCloseTimeout: 4000,
    openDelay: 400
};

/**
 * Регистраниция функции, которая по виджету класса cls возвращает target, к которому крепится тултип
 * @param {Function} cls
 * @param {function(croc.ui.form.validation.IValidatable, croc.ui.tooltip.Tooltip):jQuery} func
 */
croc.ui.form.validation.Notifier.registerTooltipTarget = function(cls, func) {
    this.__tooltipTargets[croc.utils.objUniqueId(cls)] = func;
};

croc.ui.form.validation.Notifier.__tooltipTargets = {};
