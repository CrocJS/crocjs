var lastPassedView = 0;
module.exports = function(app) {
    app.viewExtensions.push('.tpl');
    app.viewExtensions.push('.wtpl');
    app.viewExtensions.push('.jtpl');
    app.viewExtensions.push('.wjade');
    
    app.compilers['.tpl'] = function(file) {
        //todo try to replace with split
        file = file
            .replace(/<\/[\w\d\-_]+:>/g, '')
            .replace(/\{\{((?:view\s+|unbound\s+|bound\s+|unescaped\s+|\*|=)+)/g, function(match, keywords) {
                return '{{' + keywords.replace('*', 'unescaped ').replace('=', 'unbound ');
            })
            .replace(/(<\/?)widget\b/g, '$1view')
            .split('{{client}}').join('{{if #root._page.client}}')
            .replace(/\{\{(!)?(l)?(mobile|pad|desktop)}}/g, '{{if #root._page.$2device $1== \'$3\'}}')
            .replace(/\{\{\/(?:client|!?l?(?:mobile|pad|desktop))}}/g, '{{/}}')
            .replace(/\{\{ueach(.*?)}}/g, '{{unbound}}{{each$1}}{{bound}}')
            .split('{{/ueach}}').join('{{/}}{{/}}{{/}}')
            .replace(/(<[^/].*?:>)\s*\n\s*/g, '$1')
            .replace(/<(pre|textarea|script)>[\s\S]*?<\/\1>|(\s*\{c}\n)|\s*\n\s*/g, function(match, tag, cont) {
                return tag || cont ? match : ' ';
            })
            .split('{c}').join('')
            .replace(/<view is=["']:/g, '<view is="{{self}}:');
        
        do {
            var viewBegin = file.lastIndexOf('<passView');
            if (viewBegin === -1) {
                break;
            }
            var viewEnd = file.indexOf('</passView>', viewBegin);
            var passedView = file.slice(viewBegin, viewEnd + '</passView>'.length);
            var passedViewMatch = passedView.match(/<passView is="(.*?)">([\s\S]*?)<\/passView>/);
            var viewName = passedViewMatch[1];
            var viewContent = passedViewMatch[2];
            var passedName = 'PASSED_VIEW_' + viewName + '_' + (++lastPassedView);
            file = file.split(passedView).join(
                '<attribute name="_pass_view_' + viewName + '">' +
                (app._widgetCls ? app._widgetCls + ':' : '') + passedName +
                '</attribute>');
            file += '\n<' + passedName + ':>' + viewContent;
        } while (true);
        
        return file;
    };
    
    app.compilers['.wtpl'] = function(file) {
        file = app.compilers['.tpl'](file)
            .replace(/\{\{super (.*?)}}/g, '<view is="' + app._widgetBase + ':$1"/>')
            .replace(/<virtualView is="(.+?)"/g, '<view is="{{resolveVirtualView(\'$1\')}}"')
            .replace(/<\/virtualView>/g, '</view>');
        
        if (file.indexOf('<index:') !== -1) {
            var widgetClass;
            file = file.replace(/<([^! >:]+)(?: [\s\S]*?)?>/, function(widgetTag, widgetTagName) {
                widgetTag = widgetTag.replace(/class="(.*?)"\s*/, function(match, cls) {
                    widgetClass = cls;
                    return '';
                });
                
                return widgetTag.replace(/(.*?)([ >])/,
                    '$1 class="{{view \'cls\'}}" as="__elementRaw" data-cmpid="{{id}}" style="{{view \'style\'}}"$2');
            });
            
            if (widgetClass) {
                file += '\n<cls:><view is="' + app._widgetBase + ':cls"/> ' + widgetClass;
            }
        }
        
        return file;
    };
    
    var jtplCompiler = app.compilers['.jtpl'] = function(file) {
        return app.compilers['.jade'](file.replace(/^([\w\d\-_]+)/g, '$1:'));
    };
    
    app.compilers['.wjade'] = function(file) {
        return app.compilers['.wtpl'](jtplCompiler(file));
    };
};