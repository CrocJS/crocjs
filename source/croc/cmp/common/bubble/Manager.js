/**
 * Менеджер всплывающих элементов
 */
croc.Class.define('croc.cmp.common.bubble.Manager', {
    extend: croc.Object,
    
    statics: {
        /**
         * @private
         * @static
         */
        __config: {},
        
        /**
         * @private
         * @static
         */
        __instances: {},
        
        /**
         * Получить инстанцию менеджера по его имени. Если такого менеджера ещё нет, то он будет создан
         * с переданной конфигурацией.
         * @param {string} name
         * @param {Object} [config]
         * @returns {croc.cmp.common.bubble.Manager}
         * @static
         */
        getInstance: function(name, config) {
            return this.__instances[name] ||
                (this.__instances[name] = new croc.cmp.common.bubble.Manager(config || this.__config[name] || {}));
        },
        
        /**
         * Ассоциировать конфигурацию менеджера с его именем
         * @param {string} name
         * @param {Object} config
         */
        registerConfig: function(name, config) {
            this.__config[name] = config;
        }
    },
    
    events: {
        created: null
    },
    
    options: {
        /**
         * Определяет то как закрываются элементы при открытии других в коллекции.
         * none - элементы не закрываются
         * stack - элементы закрываются, но при закрытии ранее открытых открываются снова
         * permanent - элементы закрываются без последующего открытия
         * @type {string}
         */
        closeBehavior: {
            check: ['none', 'stack', 'permanent'],
            value: 'none'
        },
        
        /**
         * Приводит ли открытие плавающего элемента к закрытию остальных. Второй аргумент - true если происходит
         * открытие, false - если закрытие
         * @type {function(croc.cmp.common.bubble.IBubble, boolean):boolean}
         */
        isManageableFn: function(bubble, isOpen) { return true; }
    },
    
    construct: function(options) {
        this.__closeBehavior = options.closeBehavior;
        this.__stack = [];
        this.__shownCollection = new croc.data.ObservableArray();
        this.__openCollection = new croc.data.ObservableArray();
        this.__isManageable = options.isManageableFn;
        
        croc.cmp.common.bubble.Manager.superclass.construct.apply(this, arguments);
        this.fireEvent('created');
    },
    
    members: {
        /**
         * Добавить новый плавающий элемент в менеджер
         * @param {croc.cmp.common.bubble.IBubble} bubble
         */
        addItem: function(bubble) {
            if (this.__closeBehavior === 'none') {
                return;
            }
            
            var isStack = this.__closeBehavior === 'stack';
            
            _.assign(this.getUserData(bubble), {
                disposeListener: bubble.on('dispose', function() {
                    this.removeItem(bubble);
                }, this),
                openListener: bubble.listenProperty('open', function(open) {
                    if (open) {
                        if (!this.__disableManagement) {
                            if (isStack && this.__stack[this.__stack.length - 1] !== bubble) {
                                this.__stack.push(bubble);
                            }
                            if (this.__isManageable(bubble, true)) {
                                this.__dontCheckStack = true;
                                this.closeAll(bubble);
                                this.__dontCheckStack = false;
                            }
                        }
                    }
                    else if (isStack && !this.__dontCheckStack) {
                        this.__checkStack(bubble);
                    }
                    this.__openCollection.toggleItem(bubble, open);
                }, this),
                shownListener: bubble.listenProperty('shown', function(shown) {
                    this.__shownCollection.toggleItem(bubble, shown);
                }, this)
            });
        },
        
        /**
         * Закрывает все всплывающие элементы в коллекции. Возвращает закрытые элементы.
         * @param {...croc.cmp.common.bubble.IBubble} except
         * @returns {Array.<croc.cmp.common.bubble.IBubble>}
         */
        closeAll: function(except) {
            var exceptArr = _.toArray(arguments);
            return this.__openCollection.cloneRawArray().reverse().filter(function(bubble) {
                if (bubble && exceptArr.indexOf(bubble) === -1) {
                    bubble.close();
                    return true;
                }
                return false;
            });
        },
        
        /**
         * Коллекция открытых в данный момент элементов
         * @returns {croc.data.IObservableList}
         */
        getOpenCollection: function() {
            return this.__openCollection;
        },
        
        /**
         * Коллекция видимых в данный момент элементов
         * @returns {croc.data.IObservableList}
         */
        getShownCollection: function() {
            return this.__shownCollection;
        },
        
        /**
         * Возвращает стек открытых баблов
         * @returns {Array.<croc.cmp.common.bubble.IBubble>}
         */
        getStack: function() {
            return this.__stack;
        },
        
        /**
         * Возвращает элемент, находящийся на вершине стека
         * @returns {croc.cmp.common.bubble.IBubble}
         */
        getStackTop: function() {
            return this.__stack && _.last(this.__stack);
        },
        
        /**
         * Есть ли попап в стеке открытых плавающих элементов
         * @param {croc.cmp.common.bubble.IBubble} bubble
         * @returns {boolean}
         */
        isInStack: function(bubble) {
            return this.__stack.indexOf(bubble) !== -1;
        },
        
        /**
         * Открывает всплывающий элемент без влияния на остальные
         * @param {croc.cmp.common.bubble.IBubble} bubble
         */
        openUnmanageable: function(bubble) {
            this.__disableManagement = true;
            bubble.open();
            this.__disableManagement = false;
        },
        
        /**
         * Удалить плавающий элемент из менеджера
         * @param {croc.cmp.common.bubble.IBubble} bubble
         */
        removeItem: function(bubble) {
            if (this.__closeBehavior === 'none') {
                return;
            }
            
            var isStack = this.__closeBehavior === 'stack';
            
            var data = this.getUserData(bubble);
            data.openListener();
            data.shownListener();
            data.disposeListener();
            
            this.__shownCollection.remove(bubble);
            this.__openCollection.remove(bubble);
            
            if (isStack) {
                croc.utils.arrRemove(this.__stack, bubble);
                this.__checkStack(bubble);
            }
        },
        
        /**
         * Перепозиционировать все открытые элементы
         */
        repositionAll: function() {
            this.__openCollection.forEach(function(bubble) { bubble.reposition(); });
        },
        
        /**
         * @private
         */
        __checkStack: function(bubble) {
            if (this.__stack[this.__stack.length - 1] === bubble) {
                this.__stack.pop();
                if (this.__stack.length) {
                    if (this.__isManageable(bubble, false)) {
                        this.__stack[this.__stack.length - 1].open();
                    }
                }
            }
            else {
                croc.utils.arrRemove(this.__stack, bubble);
            }
        }
    }
});