var _ = require('lodash');

var App = require('derby/lib/App');
var Page = require('derby/lib/Page');
var Derby = require('derby/lib/Derby');
var derby = require('derby');
var hooks = require('./hooks');

var coreApps = {};
Derby.prototype.appFactory = function(options) {
    var derby = this;
    
    function factory(packageName, packageEntryPoint) {
        if (!packageName && coreApps[options.name]) {
            return coreApps[options.name];
        }
        var app = derby.createApp(options.name + (packageName ? ':' + packageName : ''),
            packageEntryPoint || options.entry);
        app.meta = options.meta || {};
        if (packageName) {
            app.isPackage = true;
            app.coreApp = coreApps[options.name];
            app.Page.prototype = app.coreApp.Page.prototype;
            app.proto = app.coreApp.proto;
            app.packageName = packageName;
        }
        else {
            coreApps[options.name] = app.coreApp = app;
        }
        if (options.callback) {
            options.callback(app);
        }
        return app;
    }
    
    var app = factory();
    app.factory = factory;
    return app;
};

App.prototype._viewsSource = function(options) {
    var result = '/*DERBY_SERIALIZED_VIEWS*/';
    if (this.isPackage) {
        result += 'module.exports = ' + this.views.serialize(options) + ';';
    }
    else {
        result += 'module.exports = function(){' +
        '(' + this.views.serialize(options) + ').apply(this, arguments);' +
        'window.require("_packageViews").apply(this, arguments);' +
        '};';
    }
    result += '/*DERBY_SERIALIZED_VIEWS_END*/';
    return result;
};

var oldAppInit = App.prototype._init;
App.prototype._init = function() {
    oldAppInit.apply(this, arguments);
    
    this.use(require('./lib/compilers'));
    hooks.appPlugins.forEach(function(x) { this.use(x); }, this);
    this.loadViews(__dirname + '/main.tpl', null, {serverOnly: true});
};

['render', 'renderStatic'].forEach(function(method) {
    var old = Page.prototype[method];
    Page.prototype[method] = function() {
        var styles = this.app.styleUrl ? '<link rel="stylesheet" href="' + this.app.styleUrl + '">' : '';
        if (this.app.isPackage && this.app.coreApp.styleUrl) {
            styles = '<link rel="stylesheet" href="' + this.app.coreApp.styleUrl + '">' + styles;
        }
        this.app.views.register('StylesLinks', styles, {serverOnly: true});
        
        if (!this.app.static) {
            var scripts = '';
            if (process.env.DERBY_RENDERER) {
                scripts += '<script>crocDerbyRendererMode = true;</script>';
            }
            scripts += '<script>Stm = {env: {device: "' + Stm.env.device + '", ldevice: "' + Stm.env.ldevice +
            '", resourcePath: "' + this.app.resourcePath + '"}}</script>';
            scripts += this.app.scriptUrl ? '<script src="' + this.app.scriptUrl + '"></script>' : '';
            if (this.app.isPackage && this.app.coreApp.scriptUrl) {
                scripts = '<script src="' + this.app.coreApp.scriptUrl + '"></script>' + scripts;
            }
            scripts += '<script>crocApp = require("crocodile-js").createApp("' + this.app.name + '");';
            if (this.app.isPackage) {
                scripts += 'crocApp.packageName = "' + this.app.packageName + '";crocApp.isPackage=true;';
            }
            if (this.app.isPackage && this.app.coreApp.entry || !this.app.isPackage && this.app.entry) {
                scripts += 'require("appEntry")(crocApp);';
            }
            if (this.app.isPackage && this.app.entry) {
                scripts += 'require("packEntry")(crocApp);';
            }
            scripts += '</script>';
            this.app.views.register('AppScript', scripts, {serverOnly: true});
        }
        else {
            this.app.views.register('AppScript', '', {serverOnly: true});
        }
        
        return old.apply(this, arguments);
    };
});

App.prototype._watchViews = App.prototype._watchStyles = App.prototype._watchBundle = _.noop;