/**
 * ООП-обёртка над DOM-элементом. Позволяет использовать связывание (binding) для различных
 * свойств и css-классов.
 */
croc.Class.define('croc.ui.Element', {
    extend: croc.Object,
    
    statics: {
        /**
         * Создать обёртку для DOM-элемента. Если обёртка для этого элемента уже была создана,
         * то используется она (необходимые свойства props добавляется к существующей обёртке)
         * @param {jQuery} el
         * @param {Array.<string>|string} [props]
         * @static
         */
        create: function(el, props) {
            var domWrapper = el.data('domWrapper');
            if (!domWrapper) {
                el.data('domWrapper', domWrapper = new croc.ui.Element({
                    el: el,
                    props: typeof props === 'string' ? [props] : props || null
                }));
            }
            else if (props) {
                this.__createProperties(domWrapper, typeof props === 'string' ? [props] : props);
            }
            
            return domWrapper;
        },
        
        /**
         * @param instance
         * @param props
         * @private
         * @static
         */
        __createProperties: function(instance, props) {
            var el = instance.getElement();
            props.forEach(function(prop) {
                var getter = croc.Object.getPropertyPart('get', prop);
                if (instance[getter]) {
                    return;
                }
                
                instance[getter] = function() {
                    return croc.utils.domGetModifier(el, prop);
                };
                instance[croc.Object.getPropertyPart('set', prop)] = function(value) {
                    croc.utils.domSetModifier(el, prop, value);
                };
            });
        }
    },
    
    properties: {
        /**
         * Текст внутри элемента
         * @type {string}
         */
        text: {
            getter: function() {
                return this.__el.text();
            },
            setter: function(value) {
                this.__el.text(value !== 0 && !value ? '' : value);
            }
        },
        
        /**
         * Подсказка для элемента
         * @type {string}
         */
        title: {
            getter: function() {
                return this.__el.attr('title') || null;
            },
            setter: function(value) {
                if (value) {
                    this.__el.attr('title', value);
                }
                else {
                    this.__el.removeAttr('title');
                }
            }
        },

        /**
         * Поканаз ли элемент
         */
        shown: {
            apply: function(value) {
                this.__el.toggleClass('b-hidden', !value);
            }
        },
        
        /**
         * Css-класс mod_...
         * @type {boolean}
         */
        mod: {
            setter: function(value) {
                croc.utils.domSetModifier(this.__el, 'mod', value);
            },
            getter: function() {
                return croc.utils.domGetModifier(this.__el, 'mod');
            }
        },
        
        /**
         * Css-класс state_active
         * @type {boolean}
         */
        state_active: {
            setter: function(value) {
                this.__el.toggleClass('state_active', value);
            },
            getter: function() {
                return this.__el.hasClass('state_active');
            }
        },
        
        /**
         * Css-класс state_hover
         * @type {boolean}
         */
        state_hover: {
            setter: function(value) {
                this.__el.toggleClass('state_hover', value);
            },
            getter: function() {
                return this.__el.hasClass('state_hover');
            }
        }
    },
    
    options: {
        /**
         * DOM-элемент
         * @type {jQuery}
         */
        el: {
            required: true
        },
        
        /**
         * Список свойств, которые нужно добавить к обёртке. Свойства соответствуют css-классам
         * элемента. Например, свойство view со значением list соответствует классу view_list. А свойство
         * state_empty соответствует классу state_empty.
         * @type {Array.<string>}
         */
        props: {
            type: 'array'
        }
    },
    
    construct: function(options) {
        this.__el = options.el;
        croc.ui.Element.superclass.construct.apply(this, arguments);
        
        if (options.props) {
            croc.ui.Element.__createProperties(this, options.props);
        }
    },
    
    members: {
        /**
         * Обёрнутый DOM-элемент
         * @returns {options.el|*}
         */
        getElement: function() {
            return this.__el;
        }
    }
});
