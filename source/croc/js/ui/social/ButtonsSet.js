/**
 * Набор социальных кнопок
 * @example
 * <div class="js-generate" data-xtype="croc.ui.social.ButtonsSet" data-conf-preset="share"></div>
 */
croc.Class.define('croc.ui.social.ButtonsSet', {
    extend: croc.ui.Container,
    
    statics: {
        /**
         * @private
         * @static
         */
        __presets: {},
        
        /**
         * Возвращает значение опции соц.кнопки на основании сервиса из опций {@link croc.ui.Container#itemDefaults}
         * и {@link #overrideButtons}
         * @param {Object} buttonsSetOptions
         * @param {string} service
         * @param {string} option
         * @returns {*}
         * @protected
         */
        getOptionValue: function(buttonsSetOptions, service, option) {
            //todo проблемы приоритета
            if (option === 'page') {
                var value = this.getOptionValue(buttonsSetOptions, service, 'url');
                if (value) {
                    return value;
                }
            }
            
            return (buttonsSetOptions.overrideButtons &&
                buttonsSetOptions.overrideButtons[service] &&
                buttonsSetOptions.overrideButtons[service].page) ||
                buttonsSetOptions.itemDefaults.items[option] ||
                croc.ui.social.Button.config.options[option].value;
        },
        
        /**
         * Зарегистрировать стандартный набор кнопок
         * @param {string} name
         * @param {function(croc.ui.social.ButtonsSet, Object)} configFunc второй параметр функции - объект с
         * конфигурационными опциями ButtonsSet
         * @static
         */
        registerPreset: function(name, configFunc) {
            this.__presets[name] = configFunc;
        }
    },
    
    properties: {
        /**
         * Действие для социальных кнопок
         * @type {string}
         */
        action: {
            cssClass: true,
            check: ['like', 'share'],
            value: 'like',
            getter: null,
            __setter: null,
            option: true,
            event: true
        },
        
        /**
         * Расположение кнопок
         * @type {string}
         */
        layout: {
            cssClass: true,
            check: ['line', 'stack', 'inline'],
            value: 'line',
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
            option: true,
            event: true
        }
    },
    
    options: {
        /**
         * Если панель близка к низу страницы, то шаринг фэйсбука режется
         * @type {boolean}
         */
        closeToEdge: {
            type: 'boolean',
            value: false
        },
        
        /**
         * Шаблон по-умолчанию
         * @type {string}
         */
        htmlTemplate: '<div class="b-social-buttons-set {view}{cls}">{items}</div>',
        
        /**
         * Конфигурация по-умолчанию добавляемая к items
         * @type {Object.<string, object>|object}
         */
        itemDefaults: {
            value: {
                items: {
                    xtype: croc.ui.social.Button
                }
            }
        },
        
        /**
         * Один из стандартных наборов социальных кнопок
         * Список пресетов задаётся в {@link croc.controllers.Configure#__configureSocialButtons}
         * @type {string}
         */
        preset: {
            type: 'string'
        },
        
        /**
         * Параметры для пресета
         * @type {Object}
         */
        presetParams: {
            value: {}
        },
        
        /**
         * Позволяет расширить конфиг для кнопок определённой соц сети.
         * @type {Object}
         */
        overrideButtons: {
            value: {}
        }
    },
    
    construct: function(options) {
        this.listenProperty('action', function(value) {
            options.itemDefaults.items.action = value;
        });
        this.listenProperty('skin', function(value) {
            options.itemDefaults.items.skin = value;
            this.getItems().forEach(function(item) { item.setSkin(value); });
        });
        
        croc.ui.social.ButtonsSet.superclass.construct.apply(this, arguments);
    },
    
    members: {
        /**
         * Дополнительные данные для рендеринга из шаблона
         * @param {Object} options
         * @returns {object}
         * @protected
         */
        _getAddRenderData: function(options) {
            return _.assign(croc.ui.social.ButtonsSet.superclass._getAddRenderData.apply(this, arguments), {
                view: options.closeToEdge ? 'view_close-to-edge' : ''
            });
        },
        
        /**
         * Выполняется когда свойства виджета уже инициализированы
         * @param {Object} options
         * @protected
         */
        _onPropertiesInitialized: function(options) {
            croc.ui.social.ButtonsSet.superclass._onPropertiesInitialized.apply(this, arguments);
            
            if (options.preset) {
                croc.ui.social.ButtonsSet.__presets[options.preset](this, options);
                if (options.action) {
                    this.__setAction(options.action);
                }
            }
            
            if (this.getAction() === 'like' && !Stm.env.IS_PRODUCTION) {
                options.items = {items: []};
                this.onChangeProperty('rendered', function() { this.destroy(); }, this);
            }
            
            if (options.items.items) {
                _.forOwn(options.overrideButtons, function(buttonOptions, service) {
                    options.items.items.forEach(function(item) {
                        if (!(item instanceof croc.ui.Widget) && item.service === service) {
                            _.assign(item, buttonOptions);
                        }
                    });
                }, this);
            }
        },
        
        /**
         * Поиск элементов DOM для всех дочерних элементов
         * @param {jQuery} el
         * @return {Object.<string, jQuery>}
         * @protected
         */
        _scanForItemsElements: function(el) {
            return {
                items: el.find('>*')
            };
        }
    }
});