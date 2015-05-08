var path = require('path');
var fs = require('fs');
var Q = require('q');
var _ = require('lodash');

var through = require('through');
var jsdepLibrary = require('jsDependencyAnalizer/library');
var jsdepExt = require('./jsdep.external');
var BuildLib = require('./lib/build');

var packageViewsPath = require.resolve('derby/lib/_packageViews');
var viewsPath = require.resolve('derby/lib/_views');

var derby;

function buildJsdep(options) {
    var config = options.config;
    var configPath = options.path;
    configPath = path.normalize(configPath);
    var frontDir = path.dirname(configPath);
    if (!config) {
        options.config = config = require(configPath);
    }
    if (!config.$$jsdep) {
        config.general.frontDir = frontDir;
        if (!('root' in config.general)) {
            config.general.root = '';
        }
        if (!('site' in config.general)) {
            config.general.site = config.general.root;
        }
        if (!('compiled' in config.general)) {
            config.general.compiled = path.join(config.general.site, 'compiled');
        }
        if (!('resources' in config.general)) {
            config.general.resources = path.join(config.general.site, 'resources');
        }
        var rootDir = path.resolve(frontDir, config.general.root);
        config.general.appUses = config.use && config.use.map(function(x) {
            return path.join(rootDir, x);
        });
        
        var jsdepConfig = jsdepExt.jsdep(config);
        var buildlib = config.$$buildlib = new BuildLib({
            config: _.defaults(config.build || {}, require('./croc.defaults.json').build),
            apps: _.zipObject(
                _.pluck(config.apps, 'path')
                    .concat(config.use || [])
                    .map(function(x) { return path.join(rootDir, x); })
                    .concat(path.join(__dirname, 'source/croc'))
                    .map(function(x) { return [path.basename(x), x]; })
            ),
            frontDir: frontDir,
            compiledDir: path.resolve(frontDir, config.general.compiled),
            publicDir: path.resolve(frontDir, config.general.site),
            projectDir: rootDir,
            resourcesDir: config.general.rendererMode && !config.general.skipResources ?
                path.resolve(frontDir, config.general.resources) : null
        });
        config.$$jsdep = buildlib.jsDependencies({
            path: configPath || process.cwd(),
            config: jsdepConfig,
            alltypes: true,
            abspath: true
        }).then(function(targets) {
            targets.forEach(function(target) {
                target.buildlib = buildlib;
            });
            return targets;
        });
    }
    return config.$$jsdep;
}

/**
 * @param options
 * @param options.config
 * @param [options.path]
 * @param options.name
 * @param callback
 */
exports.resolveApp = function(options, callback) {
    buildJsdep(options).then(function(targets) {
        targets.some(function(target) {
            if (target.target === 'app:' + options.name) {
                callback(null, resolveApp(target));
                return true;
            }
        });
    }).done();
};

/**
 * @param options
 * @param options.config
 * @param [options.path]
 * @param callback
 */
exports.resolveApps = function(options, callback) {
    buildJsdep(options).then(function(targets) {
        return targets
            .filter(function(target) {
                return _.startsWith(target.target, 'app:');
            })
            .map(function(target) {
                return resolveApp(target);
            });
    }).nodeify(callback);
};

var apps = {};
function resolveApp(target) {
    target = target.targetObj;
    if (target.rendererMode) {
        process.env.DERBY_RENDERER = true;
    }
    derby = require('./index');
    var pathToApp = jsdepLibrary.normalizePath(target, target.path);
    pathToApp = path.resolve(pathToApp);
    var name = path.basename(pathToApp);
    if (apps[name]) {
        return apps[name];
    }
    
    var appPath = pathToApp + '/app';
    var app = apps[name] = derby.createApp(name);
    _.assign(app, {
        rootPath: target.root,
        sitePath: target.site,
        path: pathToApp,
        uses: target.appUses,
        resourcePath: !target.rendererMode ? '' :
        '/' + path.relative(target.site, path.resolve(target.frontDir, target.resources))
    });
    
    if (!global.Stm) {
        global.Stm = {};
    }
    if (!global.Stm.env) {
        global.Stm.env = {};
    }
    global.Stm.env.resourcePath = app.resourcePath;
    
    app.loadViews(appPath);
    var appEntry = appPath + '/index.js';
    if (fs.existsSync(appEntry)) {
        app.entry = appEntry;
    }
    
    var packagesPath = appPath + '/packages';
    app.packages = _.mapValues(target.packages, function(x, pack) {
        var packPath = packagesPath + '/' + pack;
        var packApp = derby.createApp(name + ':' + pack);
        _.assign(packApp, {
            isPackage: true,
            coreApp: app,
            proto: app.proto,
            packageName: pack,
            path: packPath
        });
        packApp.Page.prototype = app.Page.prototype;
        //todo лишний парсинг представлений ядра
        packApp.loadViews(appPath, null, {serverOnly: true});
        packApp.loadViews(packPath);
        
        var packEntry = packPath + '/index.js';
        if (fs.existsSync(packEntry)) {
            packApp.entry = packEntry;
        }
        
        return packApp;
    });
    
    return app;
}

var stylesQueue = BuildLib.getTasksQueue(1, true);
function queueProcessStyles(options) {
    if (!_.isEmpty(options.files)) {
        var app = options.app;
        var buildlib = options.target.buildlib;
        app.styleUrl = '/' + path.relative(options.target.targetObj.site,
            buildlib.getCompiledOutput(app.name, (Stm.env.ldevice !== 'desktop' ? Stm.env.ldevice + '.' : '') + 'css'));
        return stylesQueue.addTask(function() {
            return buildlib.processStyles(options.files, {
                name: app.name,
                map: !derby.util.isProduction,
                skipOptimizations: !derby.util.isProduction,
                //version: version,
                //deferWrite: deferWrite,
                variant: 'all',
                device: Stm.env.ldevice
                //notOptimized: notOptimized
            });
        });
    }
    return Q();
}

var jsBundlesQueue = BuildLib.getTasksQueue(10);
function createJsBundle(options) {
    var buildlib = options.target.buildlib;
    var app = options.app;
    var output = buildlib.getCompiledOutput(app.name, 'js');
    app.scriptUrl = '/' + path.relative(options.target.targetObj.site, output);
    return jsBundlesQueue.addTask(function() {
        return options.target.buildlib.createBundle({
            name: app.name,
            add: options.files.filter(function(x) {
                return x.indexOf(app.path + '/app/index.') !== 0;
            }),
            external: options.external && _.without(options.external, packageViewsPath),
            //debugVersion: true,
            write: !derby.util.isProduction,
            onFiles: options.onFiles,
            //deferWrite: deferWrite,
            core: !options.isPackage,
            target: options.target,
            map: !derby.util.isProduction,
            onBundle: function(bundle) {
                var viewsFilename = app.isPackage ? packageViewsPath : viewsPath;
                bundle.require(require.resolve('derby'), {expose: 'derby'});
                bundle.require(require.resolve(__dirname), {expose: 'crocodile-js'});
                
                if (app.isPackage) {
                    bundle.require(viewsFilename, {expose: app.isPackage ? '_packageViews' : '_views'});
                }
                else {
                    var modeFilename = 'derby/lib/' + (process.env.DERBY_RENDERER ? 'rendererMode.js' : 'normalMode.js');
                    bundle.require(require.resolve(modeFilename), {expose: 'derbyMode'});
                    bundle.require(packageViewsPath, {expose: '_packageViews'});
                }
                
                if (app.entry) {
                    bundle.require(app.entry, {expose: app.isPackage ? 'packEntry' : 'appEntry'});
                }
                
                // Hack to inject the views script into the Browserify bundle by replacing
                // the empty _views.js file with the generated source
                bundle.transform(function(filename) {
                    var content;
                    if (filename === viewsFilename) {
                        content = app._viewsSource({minify: true});
                    }
                    return !content ? through() : through(
                        function write(curData) {},
                        function end() {
                            this.queue(content);
                            this.queue(null);
                        }
                    );
                });
                app.emit('bundle', bundle);
                if (options.store) {
                    options.store.emit('bundle', bundle);
                }
            }
        });
    });
}

function compileApp(options) {
    var app = options.app;
    if (options.static) {
        app.static = true;
    }
    var target = options.target;
    var js = [];
    var views = [];
    var css = [];
    var widgetClasses = options.coreWidgetClasses ? options.coreWidgetClasses.concat() : [];
    var controllers = options.controllers ? options.controllers.concat() : [];
    var widgetCls;
    (options.files || target.files).forEach(function(file) {
        var ext = path.extname(file);
        var fileDesc = target.filesHash[file];
        var symbol = fileDesc.symbols[0];
        if (ext === '.js' || ext === '.coffee') {
            if (!fileDesc.meta || !fileDesc.meta.bower && fileDesc.meta.browserify !== false) {
                require(file);
                if (global.croc && croc.Class) {
                    var cls = croc.Class.getClass(symbol);
                    if (cls) {
                        widgetCls = widgetCls || croc.Class.getClass('croc.cmp.Widget');
                        if (widgetCls && (cls === widgetCls || croc.Class.isSubClass(cls, widgetCls))) {
                            widgetClasses.push(cls);
                        }
                        if (!target.targetObj.rendererMode && croc.Controller &&
                            croc.Class.isSubClass(cls, croc.Controller) && !cls.CLIENT_ONLY) {
                            controllers.push(cls);
                        }
                    }
                }
            }
            js.push(file);
        }
        else if (ext === '.wtpl' || ext === '.wjade') {
            views.push(file);
        }
        else if (ext === '.css') {
            css.push(file);
        }
    });
    
    function addView(file, serverOnly) {
        var symbol = target.filesHash[file].symbols[0];
        if (global.croc && croc.Class) {
            var cls = croc.Class.getClass(symbol);
            app._widgetBase = cls ? cls.baseclass.classname : 'croc.cmp.Widget';
        }
        app._widgetCls = symbol;
        var options = {widgetTemplate: true};
        if (serverOnly) {
            options.serverOnly = true;
        }
        app.loadViews(path.normalize(file), symbol, options);
        delete app._widgetCls;
        delete app._widgetBase;
    }
    
    //todo optimize (don't compile view)
    if (options.coreViews) {
        options.coreViews.forEach(function(file) { addView(file, true); });
    }
    views.forEach(function(file) { addView(file); });
    
    queueProcessStyles({
        app: app,
        files: css,
        target: target
    });
    
    var deferred = Q.defer();
    var coreJsPromise = options.static ? deferred.promise : createJsBundle({
        store: options.store,
        app: app,
        files: js,
        external: options.coreJs,
        onFiles: !app.isPackage && function(coreFiles) {
            var promises = _(target.packages).map(function(files, name) {
                return compileApp({
                    store: options.store,
                    app: app.packages[name],
                    target: target,
                    files: files,
                    coreJs: coreFiles,
                    coreViews: views,
                    coreWidgetClasses: widgetClasses,
                    controllers: controllers
                });
            }).compact().value().concat(coreJsPromise);
            
            Q.all(promises).then(deferred.resolve).done();
        },
        target: target
    });
    
    if (options.static) {
        deferred.resolve();
    }
    
    return (app.isPackage ? coreJsPromise : deferred.promise).then(function() {
        app._initCroc(controllers, widgetClasses);
        function onModel(model) {
            app.model = model;
            if (app.isPackage && app.coreApp.entry) {
                require(app.coreApp.entry)(app);
            }
            if (app.entry) {
                require(app.entry)(app);
            }
        }
        
        if (app.model) {
            onModel(app.model);
        }
        else {
            app.on('model', onModel);
        }
        return app;
    });
}

/**
 * @param {Object} options
 * @param {Object} [options.config]
 * @param {string} [options.path]
 * @param {Store} [options.store]
 * @param {boolean} [options.prototype]
 * @param {boolean} [options.static]
 * @param callback
 */
exports.buildApps = function(options, callback) {
    var jsdepDef = buildJsdep(options);
    var buildlib = options.config.$$buildlib;
    if (options.prototype) {
        stylesQueue.start(true);
    }
    Q.all([
        jsdepDef,
        buildlib.clean().then(function() {
            return buildlib.copyResources(options.config.general.skipResources);
        })
    ])
        .spread(function(targets) {
            return Q.all(targets.map(function(target) {
                return compileApp({
                    store: options.store,
                    app: resolveApp(target),
                    target: target,
                    'static': options.static
                });
            }));
        })
        .then(function(apps) {
            return stylesQueue.start().thenResolve(apps);
        })
        .nodeify(callback);
};