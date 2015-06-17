var _ = require('lodash');

var lastPassedView = 0;
module.exports = function(app) {
    app.viewExtensions.push('.tpl');
    app.viewExtensions.push('.wtpl');
    app.viewExtensions.push('.jtpl');
    app.viewExtensions.push('.wjade');
    
    function transformTpl(file) {
        var openedView;
        file = file
            .replace(/<\/[\w\d\-_]+:>\s*(<[\w\d\-_]+:)/g, '$1')
            .replace(/<(\/)?([\w\d\-_]+:)([^>]*?)(\/)?>/g, function(match, slash, name, content, innerSlash) {
                var result = match;
                if (slash) {
                    result = '';
                }
                else {
                    result = '<' + name + content + '>';
                    if (openedView) {
                        result = '</' + openedView + '>' + result;
                    }
                    openedView = name;
                }
                return result;
            });
        if (openedView) {
            file += '</' + openedView + '>';
        }
        
        var cheerio = require('cheerio');
        var doc = cheerio.load(file, {
            lowerCaseAttributeNames: false,
            lowerCaseTags: false,
            decodeEntities: false,
            recognizeSelfClosing: true
        });
        
        doc('view').each(function() {
            var el = doc(this);
            var is = el.attr('is') || el.attr('name');
            if (is[0] === ':') {
                el.attr('is', el.closest('widget').attr('is') + is);
                el.removeAttr('name');
            }
        });
        
        doc('super').each(function() {
            var el = doc(this);
            var is = el.attr('is');
            var widget;
            var view = is;
            var passView = el.closest('passView');
            if (passView.length) {
                widget = passView.closest('widget').attr('is');
                if (!view) {
                    view = passView.attr('is');
                }
            }
            else {
                widget = app._widgetBase;
                if (!view) {
                    view = el.parents().last()[0].name.slice(0, -1);
                }
            }
            
            el.attr('is', widget + ':{{\'' + view + '\'}}');
            this.name = 'view';
        });
        
        doc('widget').each(function() {
            this.name = 'view';
            this.isWidget = true;
        });
        
        doc('proxyView').each(function() {
            var el = doc(this);
            var view = el.attr('is');
            el.html('<virtualView is="' + view + '"/>');
            this.name = 'passView';
        });
        
        doc('passView').get().reverse().forEach(function(domEl) {
            var el = doc(domEl);
            var view = el.attr('is');
            var passedName = 'PASSED_VIEW_' + view + '_' + (++lastPassedView);
            
            el.replaceWith('<attribute name="_pass_view_' + view + '">' +
            (app._widgetCls ? app._widgetCls + ':' : '') + passedName +
            '</attribute>');
            
            el.removeAttr('is');
            domEl.name = passedName + ':';
            
            doc.root().append('\n').append(el);
        });
        
        doc('virtualView').each(function() {
            var el = doc(this);
            var controller = el.attr('controller');
            el.attr('is',
                '{{' + (controller ? controller + '.' : '') + 'resolveVirtualView(\'' + el.attr('is') + '\')}}');
            el.removeAttr('controller');
            this.name = 'view';
        });
        
        return doc;
    }
    
    function compileTpl(file) {
        file = file
            .replace(/<\/[\w\d\-_]+:>/g, '')
            .replace(/\{\{((?:view\s+|unbound\s+|bound\s+|unescaped\s+|\*|=)+)/g, function(match, keywords) {
                return '{{' + keywords.replace('*', 'unescaped ').replace('=', 'unbound ');
            })
            .split('{{client}}').join('{{if #root._page.client}}')
            .replace(/\{\{(!)?(l)?(mobile|pad|desktop)}}/g, '{{if #root._page.$2device $1== \'$3\'}}')
            .replace(/\{\{\/(?:client|!?l?(?:mobile|pad|desktop))}}/g, '{{/}}')
            .replace(/\{\{ueach(.*?)}}/g, '{{unbound}}{{each$1}}{{bound}}')
            .split('{{/ueach}}').join('{{/}}{{/}}{{/}}')
            .replace(/(<[^/].*?:>)\s*\n\s*/g, '$1')
            .replace(/<(pre|textarea|script)>[\s\S]*?<\/\1>|(\s*\{c}\n)|\s*\n\s*/g, function(match, tag, cont) {
                return tag || cont ? match : ' ';
            })
            .split('{c}').join('');
        
        return file;
    }
    
    //html traverse
    app.compilers['.tpl'] = function(file) {
        return compileTpl(transformTpl(file).html());
    };
    
    app.compilers['.wtpl'] = function(file) {
        var doc = transformTpl(file);
        
        var indexEl = _.find(doc.root().children().get(), function(x) { return x.name === 'index:'; });
        if (indexEl) {
            indexEl = doc(indexEl);
            var widgetEl = indexEl.children().first();
            if (widgetEl.length) {
                var cls = widgetEl.attr('class');
                var style = widgetEl.attr('style');
                
                if (widgetEl[0].isWidget) {
                    var attrs = widgetEl.attr('attrs');
                    widgetEl.attr({
                        'class': cls ? '{{class}} ' + cls : '{{class}}',
                        style: style ? '{{style}} ' + style : '{{style}}',
                        attrs: !attrs ? '{{attrs}}' :
                        '{{_.assign({}, attrs, ' + attrs.substr(2, attrs.length - 4) + ')}}',
                        section: 'wrapped'
                    });
                }
                else {
                    widgetEl.attr({
                        'class': '{{view self + \':cls\'}}',
                        style: '{{view self + \':style\'}}',
                        as: '__elementRaw',
                        'data-cmpid': '{{id}}'
                    });
                    //todo remove =""
                    widgetEl.attr('{{attrs}}', '');
                    if (cls) {
                        doc.root().append('\n<cls:><view is="' + app._widgetBase + ':cls"/> ' + cls);
                    }
                    if (style) {
                        doc.root().append('\n<style:><view is="' + app._widgetBase + ':style"/>' + style);
                    }
                }
            }
        }
        
        return compileTpl(doc.html());
    };
    
    var jtplCompiler = app.compilers['.jtpl'] = function(file) {
        return app.compilers['.jade'](file.replace(/^([\w\d\-_]+)/g, '$1:'));
    };
    
    app.compilers['.wjade'] = function(file) {
        return app.compilers['.wtpl'](jtplCompiler(file));
    };
};