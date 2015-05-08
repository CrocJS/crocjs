croc.ns('croc.ui.digit');

/**
 * Для корректной работы компонента нужно обернуть "цифры" в отдельный тег,
 * для того, чтобы у этого тега не было никаких стилей, кроме font и color
 */

croc.ui.digit.DigitalRoll = croc.extend(croc.Object, {
    
    __TEMPLATE_ROLL: [
        '<div class="b-digitalroll g-clearfix">',
        '   <div class="b-digitalroll-h">',
        '       <div class="b-digitalroll-left"><div>{top_fixed}</div><div>{bottom_fixed}</div></div>',
        '       <div class="b-digitalroll-right"><div>{top}</div><div>{bottom}</div></div>',
        '   </div>',
        '</div>'
    ].join(''),
    
    /**
     * @type {Number} Скорость анимации барабана
     */
    animationSpeed: 300,
    
    /**
     * @type {jQuery}
     */
    el: null,
    
    /**
     * Сохраняет длину значения
     * Например, this.getValue() + 1: "000097" => "000098"
     * @type {Boolean}
     */
    keepLength: false,
    
    /**
     * По умолчанию барабаны добавляются в document.body, но в некоторых случаях необходимо
     * выравнивать барабаны относительно конкретного блока
     * @type {Function}
     */
    renderAtFn: null,
    
    /**
     * Слой z-index
     * @type {string}
     */
    zIndexLayer: null,
    
    init: function() {
        this.__el = this.el.css({display: 'inline-block'});
    },
    
    /**
     * Текущее значение
     * @returns {Number}
     */
    getValue: function() {
        return parseInt(this.__el.text(), 10);
    },
    
    /**
     * Крутнуть барабан
     * @param val {Number} Следующее значение барабана
     * @param [direction] {Number} Направление
     */
    update: function(val, direction) {
        var self = this,
            curr = this.__el.text() + '',
            currInt = parseInt(curr, 10),
            next = val + '',
            nextInt = parseInt(next, 10),
            fixed = '',
            cutIndex = 0;
        
        if (next === curr) {
            return;
        }
        
        if (this.keepLength) {
            next = curr.slice(0, curr.length - next.length) + next;
        }
        
        if (curr !== next && curr.length === next.length) {
            for (var i = 0; i < next.length; i++) {
                if (next.charAt(i) === curr.charAt(i)) {
                    fixed += next.charAt(i);
                    cutIndex++;
                }
                else {
                    break;
                }
            }
        }
        
        this.__el.css('visibility', 'hidden').text(next);
        
        direction = direction || (nextInt >= currInt ? 1 : -1);
        var offset = this.__el.offset(),
            height = this.__el.height(),
            cfg = {
                top_fixed: fixed,
                bottom_fixed: fixed
            };
        
        if (direction > 0) {
            cfg.top = next.substr(cutIndex);
            cfg.bottom = curr.substr(cutIndex);
        }
        else {
            cfg.top = curr.substr(cutIndex);
            cfg.bottom = next.substr(cutIndex);
        }
        
        var overBlock = $(this.__TEMPLATE_ROLL.render(cfg)).children().css({top: direction > 0 ? -height : 0}).end(),
            overBlockRight = overBlock.find('.b-digitalroll-right');
        
        if (!this.__zIndex) {
            this.__zIndex = croc.utils.getZIndex(this.zIndexLayer);
        }
        
        var overBlockConfig = {
            height: height,
            fontSize: this.__el.css('fontSize'),
            fontWeight: this.__el.css('fontWeight'),
            lineHeight: this.__el.css('lineHeight'),
            color: this.__el.css('color'),
            textShadow: this.__el.css('textShadow'),
            zIndex: this.__zIndex
        };
        
        if (this.renderAtFn) {
            this.renderAtFn(overBlock, overBlockConfig);
        }
        else {
            overBlockConfig = _.assign(overBlockConfig, {
                top: offset.top,
                left: offset.left
            });
            $(document.body).append(overBlock.css(overBlockConfig));
        }
        
        this.fireEvent('update', this, overBlock);
        
        overBlockRight.animate({top: direction * height}, this.animationSpeed, function() {
            self.__el.css('visibility', '');
            overBlock.remove();
        });
    }
    
});