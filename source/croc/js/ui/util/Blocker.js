/**
 * todo comment me
 */
croc.Class.define('croc.ui.util.Blocker', {
    extend: croc.Object,
    
    properties: {
        /**
         * Скрыть/показать лоадер
         * @type {boolean}
         */
        blocked: {
            apply: function(value) {
                if (value) {
                    this.__block();
                }
                else {
                    this.__unblock();
                }
            },
            value: true,
            event: true,
            option: true
        },
        
        /**
         * Прозрачность фона
         * @type {string}
         */
        opacity: {
            type: 'string',
            check: ['05', '1'],
            option: true
        },
        
        /**
         * Тип лоадера
         * @type {string}
         */
        type: {
            value: 'big',
            option: true
        }
    },
    
    options: {
        /**
         * @type {jQuery|croc.ui.Widget}
         */
        target: {
            required: true
        }
    },
    
    construct: function(options) {
        croc.ui.util.Blocker.superclass.construct.apply(this, arguments);
        
        if (options.target instanceof croc.ui.Widget) {
            this.__element = options.target.getElement();
            if (!this.__element) {
                options.target.on('render', function(widget, el) {
                    this.__element = el;
                    
                    if (this.getBlocked()) {
                        this.__block();
                    }
                }, this);
            }
        }
        else {
            this.__element = options.target;
        }
        
        this.__isPseudoLink = this.__element.is('span.b-pseudolink');
        
        if (this.getBlocked()) {
            this.__block();
        }
    },
    
    members: {
        /**
         * @private
         */
        __block: function() {
            if (this.__element && !this.__blockerElement) {
                this.__blockerElement = this.__isPseudoLink ?
                    $('<span class="b-loader loader_small" style="display: inline-block"></span>') :
                    $('<div class="b-loader loader_' +
                    this.getType() +
                    (this.getOpacity() ? ' opacity_' + this.getOpacity() : '') + '"></div>').css({
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: croc.utils.getZIndex('page')
                    });
                
                this.__blockerElement.click(function(e) {e.stopPropagation();});
                
                this.__element.append(this.__blockerElement);
            }
        },
        
        /**
         * @private
         */
        __unblock: function() {
            if (this.__blockerElement) {
                this.__blockerElement.remove();
                this.__blockerElement = null;
            }
        }
    }
});
