var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var library = require('jsDependencyAnalizer/library');

var jsdepExt = module.exports = {
    /**
     * @param {Object} options
     * @param {string} options.path
     * @returns {Function}
     */
    app: function(options) {
        return function(target) {
            function addIncludes(curTarget, path_) {
                library.addIncludes(curTarget, ['js', 'coffee', 'tpl', 'jade']
                    .map(function(x) { return path.join(path_, 'index.' + x); })
                    .filter(function(x) {
                        return fs.existsSync(library.normalizePath(target, x));
                    }));
            }
            
            addIncludes(target, path.join(options.path, 'app'));
            
            var packsDir = path.join(options.path, 'app/packages');
            var packsDirFull = library.normalizePath(target, packsDir);
            if (fs.existsSync(packsDirFull)) {
                var packs = fs.readdirSync(packsDirFull);
                target.packages = target.packages ? _.clone(target.packages) : {};
                packs.forEach(function(pack) {
                    var packTarget = target.packages[pack] || (target.packages[pack] = {});
                    addIncludes(packTarget, path.join(packsDir, pack));
                });
            }
        };
    },
    
    /**
     * @param {Object} options
     * @param {string} options.path
     * @returns {Function}
     */
    bower: function(options) {
        return function(target) {
            library.addSources(target, [{
                path: options.path,
                mask: '*/.bower.json',
                symbol: function(ref) {
                    return 'bower:' + ref.split('/')[0];
                }
            }]);
        };
    },
    
    /**
     * @param [options]
     * @param {Array.<string>} [options.add]
     */
    cssBlocks: function(options) {
        return function(target) {
            var general = {
                type: 'css',
                mask: '*/*.css',
                symbol: function(ref) {
                    var symbol = ref.split('/');
                    return symbol[1] === 'index' ? symbol[0] : symbol.join('.');
                }
            };
            
            var add = options.add || [];
            var start = -add.length - 1;
            library.addSources(target, __dirname, [_.assign({
                path: 'source/croc/css/blocks',
                weight: start
            }, general)]);
            add.forEach(function(curPath, i) {
                library.addSources(target, [_.assign({
                    path: curPath,
                    weight: start + i + 1
                }, general)]);
            });
        };
    },
    
    /**
     * @param options
     * @param {Array.<string>} [options.apps]
     * @param {string} options.bower
     * @param [options.type=['coffee', 'js', 'wtpl', 'wjade']]
     * @param {Object} [options.vendorJs]
     */
    general: function(options) {
        if (!options.bower) {
            throw new Error('Please specify bower directory!');
        }
        return [
            jsdepExt.vendorJS(options.vendorJs && {add: options.vendorJs}),
            jsdepExt.bower({path: options.bower}),
            jsdepExt.cssBlocks({add: options.apps.map(function(x) { return path.join(x, 'css/blocks'); })}),
            function(target) {
                var tplRE = /\{\{(?:(?:if|each|ueach|on|unless|with) |=|\*)?(.+?)(?: as .*?)?}}/g;
                library.addOptions(target, {
                    htmlSymbolRegexp: [
                        /\bis\s*=\s*['"]([\w\d_]+\.[\w\d_\.]+)["']/g
                    ],
                    tplJs: [function(source) {
                        var match;
                        var code = [];
                        while (match = tplRE.exec(source)) { // jshint ignore:line
                            code.push(match[1]);
                        }
                        return code.join(';');
                    }]
                });
                
                var addSymbols = [
                    '.View', '.css',
                    '.css.mobile', '.css.-mobile',
                    '.css.desktop', '.css.-desktop',
                    '.css.pad', '.css.-pad'
                ];
                var deps = function(ref, symbol, type) {
                    if (type === 'js' || type === 'wtpl') {
                        return _.zipObject(addSymbols.map(function(x) { return [symbol + x, 'followOptional']; }));
                    }
                };
                library.addSources(target, __dirname, [
                    {
                        path: {
                            'source/croc/cmp': 'croc.cmp.',
                            'source/croc/js': 'croc.'
                        },
                        symbol: function(ref) {
                            return ref === 'core' ? 'croc' : ':default';
                        },
                        dependencies: deps,
                        type: ['js', 'wtpl', 'css']
                    }
                ]);
                var pathObj = {};
                options.apps.forEach(function(appPath) {
                    var name = path.basename(appPath);
                    pathObj[path.join(appPath, 'cmp')] = name + '.cmp.';
                    pathObj[path.join(appPath, 'js')] = name + '.';
                });
                library.addSources(target, [
                    {
                        path: pathObj,
                        dependencies: deps,
                        //todo add jtpl, coffee
                        type: ['js', 'wtpl', 'css']
                    }
                ]);
                
                target.include = [
                    '!!' + __dirname + '/source/croc/css/common.css',
                    'b-html',
                    'croc.package',
                    'croc.Compatibility',
                    'croc',
                    'croc.utils',
                    'croc.controllers.Initialize'
                ].concat(target.include || []);
            }];
    },
    
    /**
     * @param options
     * @param {Object} [options.general]
     * @param {Array.<Object>} options.apps
     * @param {Array.<Object>} [options.use]
     * @param {string} options.bower
     * @param [options.type=['coffee', 'js', 'wtpl', 'wjade']]
     * @param {Object} [options.vendorJs]
     * @param {Object} [options.targets]
     */
    jsdep: function(options) {
        var targets = options.targets ? _.clone(options.targets) : {};
        targets.general = library.merge({
            external: [jsdepExt.general(_.assign(_.pick(options, 'bower', 'type', 'vendorJs'), {
                apps: _.pluck(options.apps, 'path').concat(options.use || [])
            }))]
        }, options.general);
        
        targets.current = {
            run: options.apps.map(function(obj) {
                var appName = path.basename(obj.path);
                targets['app:' + appName] = library.merge({
                    extend: 'general',
                    external: [jsdepExt.app({path: obj.path})]
                }, obj);
                return 'app:' + appName;
            })
        };
        
        return targets;
    },
    
    /**
     * @param [options]
     * @param {Object.<string,string|Array.<string>>} [options.add]
     * @returns {Function}
     */
    vendorJS: function(options) {
        function mapSources(sourcesObj) {
            return _.map(sourcesObj, function(file, symbol) {
                var general = {symbol: symbol, meta: {server: false}, analyze: false};
                if (_.isPlainObject(file)) {
                    return _.assign(general, file);
                }
                else {
                    general.file = file;
                    return general;
                }
            });
        }
        
        return function(target) {
            library.addSources(target, __dirname, mapSources({
                '$.autogrowinput': 'source/croc/vendor/jquery.autogrowinput.js',
                '$.autosize': 'source/croc/vendor/jquery.autosize.fixed.js',
                '$.history': 'source/croc/vendor/jquery.history.js'
            }));
            if (options && options.add) {
                library.addSources(target, mapSources(options.add));
            }
        };
    }
};