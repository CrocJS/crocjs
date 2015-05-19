process.env.DERBY_FLEXIBLE_PAGE_RENDER = true;

var App = require('derby/lib/App');
var Derby = require('derby/lib/Derby');
var derbyTemplates = require('derby/node_modules/derby-templates');
var derby = module.exports = require('derby');

var stubWidget;
var getStubWidget = function() {
    return stubWidget ||
        (stubWidget = croc.Class.define('croc.cmp.StubWidget', {
            extend: croc.cmp.Widget,
            
            members: {
                $$checkOptions: false
            }
        }));
};

App.prototype._initCroc = function(controllers, widgetClasses) {
    this.views.app = this;
    
    (widgetClasses || croc.cmp.Widget.CLASSES).forEach(function(Cls) {
        this.component(Cls.classname, Cls);
    }, this);
    for (var name in this.views.nameMap) {
        var view = this.views.nameMap[name];
        if (!view.componentFactory && view.options && view.options.widgetTemplate && name.indexOf(':') === -1) {
            this.component(name, getStubWidget());
        }
    }
    
    croc.initialize(this, controllers);
    if (croc.isServer) {
        croc.Controller.classes = [];
    }
};

function substituteMarkupHook(view) {
    var template = view.template;
    var marker = template && template.content[0];
    if (marker && marker.hooks && marker.hooks[0] instanceof MarkupHook) {
        view.template = Object.create(template);
        view.template.content = template.content.concat();
        view.template.content[0] = Object.create(template.content[0]);
        view.template.content[0].data = view.name;
    }
}

function checkInheritedTemplate(views, name, namespace) {
    var colonIndex = name.lastIndexOf(':');
    var ns = colonIndex !== -1 ? name.slice(0, colonIndex) : namespace;
    if (colonIndex !== -1) {
        name = name.slice(colonIndex + 1);
    }
    
    var map = views.nameMap;
    
    if (!ns || name in croc.Class.classes) {
        ns = name;
        name = null;
    }
    
    name = name ? ':' + name : '';
    
    if (map[ns + name]) {
        return map[ns + name];
    }
    
    var Cls = croc.Class.classes[ns];
    if (!Cls) {
        var indexView = map[ns];
        if (indexView && indexView.options && indexView.options.widgetTemplate) {
            Cls = getStubWidget();
        }
    }
    if (Cls && Cls.$$widgetClass) {
        if (!name && Cls.config.type === 'abstract') {
            return derbyTemplates.templates.emptyTemplate;
        }
        var baseCls = Cls;
        while ((baseCls = baseCls.baseclass) && baseCls.$$widgetClass) {
            var curView = map[baseCls.classname + name];
            if (curView) {
                var match = map[ns + name] = Object.create(curView);
                match.registeredName = ns;
                match.name = ns + (name || ':index');
                match.namespace = ns;
                match.options = {serverOnly: true};
                
                if (!name) {
                    if (curView.template) {
                        substituteMarkupHook(match);
                    }
                    else {
                        match.template = null;
                        match.parse = function() {
                            if (!curView.template) {
                                curView.parse();
                            }
                            delete match.template;
                            substituteMarkupHook(match);
                            return match.template;
                        };
                    }
                }
                
                return match;
            }
        }
    }
}

var Views = derbyTemplates.templates.Views;
var View = derbyTemplates.templates.View;
var MarkupHook = derbyTemplates.templates.MarkupHook;
var oldViewsFind = Views.prototype.find;
Views.prototype.find = function(name, namespace) {
    var match;
    
    if (name.indexOf(':') !== -1) {
        match = oldViewsFind.call(this, name);
        if (!match) {
            match = checkInheritedTemplate(this, name, namespace);
            if (match) {
                return match;
            }
        }
        return oldViewsFind.apply(this, arguments);
    }
    
    match = oldViewsFind.apply(this, arguments);
    if (!match) {
        match = checkInheritedTemplate(this, name, namespace);
    }
    return match;
};

require('./lib/pageExtends');

if (!derby.util.isServer) {
    require('./lib/customEvents');
    var oldAppInit = App.prototype._finishInit;
    App.prototype._finishInit = function() {
        this.on('ready', function() {
            this._initCroc();
        }.bind(this));
        
        croc.app = this;
        oldAppInit.apply(this, arguments);
        this.emit('finishInit');
    };
}

derby.util.serverRequire(module, './index.server');