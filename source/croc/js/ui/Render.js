croc.Class.define('croc.ui.Render', {
    type: 'static',
    
    statics: {
        /**
         * @param config
         * @returns {string}
         */
        icon: function(config) {
            if (config.html) {
                return config.html.render({text: config.text || ''});
            }
            
            config = _.assign({}, config);
            if (config.button && !config.text) {
                config.cls = config.cls ? config.cls + ' type_button' : 'type_button';
            }
            if (config.size) {
                config.cls = config.cls ? config.cls + ' size_' + config.size : 'size_' + config.size;
            }
            if (!config.text) {
                config.text = '';
            }
            config.content = config.content || '<span class="g-icon-item"></span>';
            if (!config.style) {
                config.style = '';
            }
            if (!config.tag) {
                config.tag = 'span';
            }
            if (!config.attrs) {
                config.attrs = '';
            }
            
            return (config.side === 'right' ? this.__ICON_HTML_RIGHT : this.__ICON_HTML).render(config);
        },
        
        /**
         * @param {jQuery} iconEl
         * @returns {{html: (string), text: string}}
         */
        parseIcon: function(iconEl) {
            iconEl = iconEl.clone();
            var wasReplaced = false;
            var text = [];
            
            iconEl.contents().each(function(node) {
                var el = $(node);
                var isTextNode = node.nodeType === 3;
                if (isTextNode && el.text().trim() === '') {
                    el.remove();
                    return;
                }
                
                if (!el.hasClass('g-icon-h')) {
                    text.push(isTextNode ? el.text() : node.outerHTML);
                    if (wasReplaced) {
                        el.remove();
                    }
                    else {
                        el.replaceWith('{text}');
                        wasReplaced = true;
                    }
                }
            });
            
            if (!wasReplaced) {
                if (iconEl.hasClass('side_right')) {
                    iconEl.prepend('{text}');
                }
                else {
                    iconEl.append('{text}');
                }
            }
            
            return {
                html: iconEl[0].outerHTML,
                text: text.join('')
            };
        },
        
        pseudoLink: function(config) {
            config = _.assign({}, config);
            config.cls = config.cls ? ' ' + config.cls : '';
            if (!config.tag) {
                config.tag = 'span';
            }
            config.attrs = config.attrs ? ' ' + config.attrs : '';
            if (!config.text) {
                config.text = '';
            }
            
            return this.__PSEUDO_HTML.render(config);
        },
        
        __ICON_HTML: '<{tag} {attrs} class="g-icon {cls}"><span class="g-icon-h" style="{style}">{content}</span>{text}</{tag}>',
        __ICON_HTML_RIGHT: '<{tag} {attrs} class="g-icon side_right {cls}">{text}<span class="g-icon-h" style="{style}">{content}</span></{tag}>',
        __PSEUDO_HTML: '<{tag} class="g-pseudo{cls}"{attrs}><span class="g-pseudo-h">{text}</span></{tag}>'
    }
});