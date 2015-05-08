process.umask(parseInt('000', 8));

var Q = require('q');
var _ = require('lodash');
_.assign(require('fs'), require('graceful-fs'));

var fs = require('fs-extra');
var writeFile = Q.denodeify(fs.writeFile);
var readFile = Q.denodeify(fs.readFile);
var rm = Q.denodeify(fs.remove);
var path = require('path');

var browserify = require('browserify');
var uglify = require('uglify-js');
//var convertSourceMap = require('convert-source-map');
var sourceMapConcat = require('source-map-concat');
var sourceMapResolve = require('source-map-resolve').resolveSourceMapSync;
var sourceMapDummy = require('source-map-dummy');

var jsdep = require('jsDependencyAnalizer');

var postcss = require('postcss');
var postcssImport = require('postcss-import');
var postcssAssets = require('postcss-assets');
var csswring = require('csswring');
var postcssUrl = require('postcss-url');
var bless = require('bless');
var cssByeBye = require('./css-byebye');
var autoprefixer = require('autoprefixer-core');
var iefix = require('./iefix');

var BuildLib = module.exports = function(config) {
    var library = this;
    var hashes = {};
    var lastHash = 0;
    var files = {};
    var cssSources = {};
    _.assign(this, {
        CSS_VARIANTS: ['all', 'ie8|ie9'],
        
        config: null,
        frontDir: null,
        compiledDir: null,
        crocDir: path.join(__dirname, '../..'),
        publicDir: null,
        projectDir: null,
        resourcesDir: null,
        apps: null,
        
        addSuffix: function(fileName, suffix) {
            if (!suffix) {
                return fileName;
            }
            var extName = path.extname(fileName);
            return fileName.slice(0, -extName.length) + suffix + extName;
        },
        
        /**
         * @param [resourcesOnly]
         * @returns {Q.promise}
         */
        clean: function(resourcesOnly) {
            var promises = _.map(library.apps, function(x, key) {
                return library.resourcesDir && rm(path.join(library.resourcesDir, key));
            });
            if (!resourcesOnly) {
                promises.push(
                    rm(library.compiledDir),
                    rm(path.join(library.frontDir, 'sources.json'))
                );
            }
            
            return Q.all(promises);
        },
        
        /**
         * @returns {Q.promise}
         */
        copyResources: function(skipResources) {
            fs.mkdirpSync(library.compiledDir);
            if (library.resourcesDir && !skipResources) {
                fs.mkdirpSync(library.resourcesDir);
                return Q.all(_.map(library.apps, function(dir, key) {
                    var sourceDir = path.join(dir, 'images');
                    if (fs.existsSync(sourceDir)) {
                        var publicDir = path.join(library.resourcesDir, key);
                        if (!fs.existsSync(publicDir)) {
                            fs.mkdirSync(publicDir);
                        }
                        var targetDir = path.join(publicDir, 'images');
                        return Q.nfcall(fs.copy, sourceDir, targetDir)
                            .then(function() {
                                return Q.nfcall(require('chmodr'), targetDir, parseInt('777', 8));
                            });
                    }
                }));
            }
            else {
                return Q();
            }
        },
        
        /**
         * @param {Object} options
         * @param {string} options.name
         * @param {Array.<string>} options.add
         * @param {Object} [options.target]
         * @param {Array.<string>} [options.debugVersion=false] добавляет .debug к имени перед .js
         * @param {Array.<string>} [options.external]
         * @param {boolean} [options.core]
         * @param {function(Array.<string>)} [options.onFiles]
         * @param {Array} [options.deferWrite]
         * @param {boolean} [options.map]
         * @param {boolean} [options.minify]
         * @param {function(Browserify)} [options.onBundle]
         * @return {Q.promise.<Object>}
         */
        createBundle: function(options) {
            var deferred = Q.defer();
            
            var output = library.getCompiledOutput(options.name, 'js');
            if (files[output]) {
                throw new Error('Пакет с именем ' + output + ' уже существует!');
            }
            files[output] = true;
            
            //create bundle
            var bundle = browserify({exposeAll: true});
            if (options.onBundle) {
                options.onBundle(bundle);
            }
            if (options.core) {
                bundle.add(__dirname + '/expose');
            }
            bundle._hash = function(id) {
                var basedir = this._basedir;
                if (!basedir) {
                    basedir = process.cwd();
                }
                id = path.relative(basedir, id);
                return hashes[id] || (hashes[id] = ++lastHash);
            };
            
            //add files
            var addFiles = options.add;
            var outsideFiles = [];
            if (options.target) {
                var filesHash = options.target.filesHash;
                addFiles = addFiles.filter(function(file) {
                    var meta = filesHash[file].meta;
                    if (meta && (meta.bower || meta.browserify === false)) {
                        outsideFiles.push(file);
                        return false;
                    }
                    return true;
                });
            }
            
            bundle.add(addFiles);
            if (options.external) {
                bundle.external(options.external);
            }
            
            //read outside files
            var outsideFilesPromise = Q.all(outsideFiles.map(_.ary(readFile, 1)));
            
            //write script
            var packFiles = [];
            bundle.on('file', function(file) {packFiles.push(file);});
            
            bundle.bundle({debug: options.map}, function(err, code) {
                if (err) {
                    throw err;
                }
                
                outsideFilesPromise.then(function(outsideCode) {
                    outsideCode = _.invoke(outsideCode, 'toString');
                    code = code.toString();
                    
                    if (options.map) {
                        //concatenate outside files with bundle saving source map
                        var jsFiles = outsideFiles.map(function(file, i) {
                            var code = outsideCode[i];
                            return {
                                source: file,
                                code: code,
                                map: sourceMapDummy(code, {source: file, type: 'js'})
                            };
                        });
                        
                        var bundleSourceMap = sourceMapResolve(code, output, fs.readFileSync);
                        jsFiles.push({
                            map: bundleSourceMap.map,
                            sourcesRelativeTo: bundleSourceMap.sourcesRelativeTo,
                            source: output,
                            code: code
                        });
                        
                        var concatResult = sourceMapConcat(jsFiles, {delimiter: '\n'})
                            .toStringWithSourceMap({file: path.basename(output)});
                        var map = concatResult.map.toJSON();
                        
                        //rebase source urls
                        map.sources = map.sources.map(function(source) {
                            return source.substr(library.projectDir.length);
                        });
                        
                        //add outside files content to map
                        outsideCode.forEach(function(code, i) {
                            map.sourcesContent[i] = code;
                        });
                        
                        //cut source mapping from browserify bundle and add actual one
                        code = concatResult.code.substr(0, concatResult.code.lastIndexOf('//# sourceMappingURL')) +
                        '//# sourceMappingURL=data:application/json;base64,' +
                        new Buffer(JSON.stringify(map)).toString('base64');
                    }
                    else if (outsideCode.length) {
                        code = outsideCode.join('\n') + '\n' + code;
                    }
                    
                    if (options.minify) {
                        code = uglify.minify(code, {fromString: true}).code;
                    }
                    
                    library.__writeFile(output, code, options.deferWrite);
                    
                    if (options.onFiles) {
                        options.onFiles(packFiles);
                    }
                    
                    deferred.resolve();
                }).done();
            });
            
            return deferred.promise;
        },
        
        getCompiledOutput: function(name, postfix) {
            return path.join(library.compiledDir, name + '.' + postfix);
        },
        
        /**
         * @param [addOptions]
         * @returns {Q.promise.<Object>}
         */
        jsDependencies: function(addOptions) {
            return Q.nfcall(jsdep.build, _.assign({
                path: path.join(library.frontDir, 'jsdep.js'),
                target: 'current',
                abspath: true,
                cache: path.join(library.frontDir, '.jsdepcache')
            }, addOptions)).then(function(targets) {
                return Array.isArray(targets) ? targets : [targets];
            });
        },
        
        /**
         * @param {Array.<string>} css
         * @param options
         * @param options.name
         * @param [options.map]
         * @param {string} [options.notOptimized]
         * 'add' - build bundle for "not optimized for mobile"
         * 'replace' - build it and use instead of mobile version
         * 'both' - build it and use instead of mobile version, but build mobile version too
         * @param [options.variant]
         * @param [options.device]
         * @param [options.skipOptimizations]
         * @param [options.version]
         * @param {Array} [options.deferWrite]
         */
        processStyles: function(css, options) {
            var result = {};
            var rootPaths = _(library.apps).map(function(x) { return path.dirname(x); }).uniq().value();
            var appsNames = Object.keys(library.apps);
            var output = library.getCompiledOutput(options.name, 'css');
            var blankCss = path.join(library.crocDir, '/source/croc/css/blank.css');
            
            function processCss(variant, device, notOptimized) {
                var ie = variant !== 'all';
                var notOptimizedStyles = notOptimized && notOptimized !== 'keep';
                //desktop is -mobile and -pad
                var cssNames = ['desktop', 'mobile', 'pad']
                    .map(function(x) { return (device !== x ? '-' : '') + x; });
                
                var processor = postcss()
                    .use(postcssImport({
                        path: library.projectDir,
                        transform: function(source, file) {
                            //prevent "is empty" message
                            var extMatch = file.match(/\/(-?(?:desktop|mobile|pad))\.css$/);
                            if (source.trim() === '' || extMatch && cssNames.indexOf(extMatch[1]) === -1) {
                                return '/* empty css file */';
                            }
                            return source.replace(/@import\s*(?:url\(|"|')(.*?)[)"']\s*;(?:\/\*-not-optimized=(.*?)\*\/)?/g,
                                function(match, src, notOptimizedDevice) {
                                    var curDevice = notOptimizedStyles && notOptimizedDevice || device;
                                    //desktop is -mobile and -pad
                                    var cssNames = ['desktop', 'mobile', 'pad']
                                        .map(function(x) { return (curDevice !== x ? '-' : '') + x; });
                                    var newSrc;
                                    if (src[0] === '/') {
                                        newSrc = src.substr(1);
                                        newSrc = rootPaths.reduce(function(result, curPath) {
                                            if (result) {
                                                return result;
                                            }
                                            var curSrc = path.join(curPath, newSrc);
                                            if (fs.existsSync(curSrc)) {
                                                return curSrc;
                                            }
                                        }, null);
                                        if (!newSrc) {
                                            throw new Error('Import error: file ' + src + ' from file ' + file + ' has\'nt been found');
                                        }
                                        src = newSrc;
                                    }
                                    else {
                                        src = path.join(path.dirname(file), src);
                                        
                                        if (src.indexOf('$device') !== -1 || src.indexOf('$scheme') !== -1) {
                                            src = src.split('$scheme').join('blue');
                                            
                                            newSrc = cssNames.reduce(function(result, folder) {
                                                if (result) {
                                                    return result;
                                                }
                                                var curSrc = src.split('$device').join(folder);
                                                if (fs.existsSync(curSrc)) {
                                                    return curSrc;
                                                }
                                            }, null);
                                            
                                            src = newSrc || blankCss;
                                        }
                                    }
                                    return '@import url(/' + path.relative(library.projectDir, src) + ');';
                                });
                        }
                    }));
                
                //change /*inline*/ to inline(...) for postcss-assets
                processor.use(function(css) {
                    css.eachRule(function(rule, i) {
                        var inline = false;
                        rule.each(function(node) {
                            if (node.type === 'decl' && inline) {
                                node.value = node.value.replace(/\burl\(/, 'inline(');
                            }
                            inline = node.type === 'comment' && node.text === 'inline';
                        });
                    });
                });
                
                processor.use(postcssAssets({
                    loadPaths: rootPaths.concat(library.publicDir)
                }));
                processor.use(autoprefixer({
                    browsers: library.config[device !== 'desktop' ? 'mobile|pad' : ie ? 'ie8|ie9' : 'all'].join(',')
                }));
                if (ie) {
                    processor.use(iefix);
                }
                
                if (!options.skipOptimizations) {
                    if (!ie) {
                        //skip :not(.ie8
                        processor.use(cssByeBye({selectors: [/^[^(]*\.ie[89]\b/]}));
                    }
                    processor.use(csswring());
                }
                
                var resourcesRel = library.resourcesDir ? path.relative(library.publicDir, library.resourcesDir) : null;
                processor.use(postcssUrl({
                    url: function(url) {
                        if (resourcesRel && appsNames.some(function(x) { return url.indexOf('/' + x + '/') === 0; })) {
                            url = '/' + path.join(resourcesRel, url);
                        }
                        if (options.version && _.contains(['.png', '.jpg', '.jpeg', '.gif'], path.extname(url))) {
                            url += options.version;
                        }
                        if (library.config.relativeTo && url.indexOf('data:') !== 0 && url !== 'about:blank') {
                            url = '../../' + url.substr(1);
                        }
                        return url;
                    }
                }));
                
                var suffix = ie ? '.ie' :
                    device !== 'desktop' ? '.' + device :
                        notOptimized ? '.no' : '';
                
                var file = path.resolve(library.addSuffix(output, suffix));
                var code = processor.process(css, {
                    from: library.publicDir + '/styles.css',
                    to: file,
                    map: !ie && options.map && {inline: true}
                }).css;
                
                var files;
                if (ie) {
                    //split styles for ie
                    var parser = new bless.Parser({
                        output: file,
                        options: {
                            cleanup: false,
                            compress: false,
                            imports: false
                        }
                    });
                    //always sync
                    parser.parse(code, function(err, result) {
                        result.forEach(function(x) { x.filename = x.filename.replace('-blessed', ''); });
                        files = result;
                    });
                }
                else {
                    files = [{filename: file, content: code}];
                }
                
                if (notOptimized !== 'add' && notOptimized !== 'keep') {
                    var realDevice = notOptimized ? 'mobile' : device;
                    result[variant + (realDevice === 'desktop' ? '' : '_' + realDevice)] = _.pluck(files, 'filename');
                }
                return Q.all(files.map(function(x) {
                    return library.__writeFile(x.filename, x.content, options.deferWrite);
                }));
            }
            
            css = css.map(function(file) {return '@import url(' + file + ');';}).join('');
            
            var sourcesKey = css + (options.notOptimized || '');
            if (!cssSources[sourcesKey]) {
                cssSources[sourcesKey] = result;
                var tasks = [];
                (options.variant ? [options.variant] : library.CSS_VARIANTS).forEach(function(variant) {
                    (options.device ? [options.device] : library.config.devices).forEach(function(device) {
                        if ((variant === 'all' || device === 'desktop') &&
                            (device !== 'mobile' || options.notOptimized !== 'replace')) {
                            tasks.push(processCss(variant, device,
                                device === 'mobile' && options.notOptimized === 'both' && 'keep'));
                        }
                        if (variant === 'all' && device === 'mobile' && options.notOptimized) {
                            tasks.push(processCss('all', 'desktop', options.notOptimized));
                        }
                    });
                });
                return Q.all(tasks).thenResolve(result);
            }
            else {
                return Q(cssSources[sourcesKey]);
            }
        },
        
        __writeFile: function(file, conent, deferWrite) {
            if (deferWrite) {
                deferWrite.push(function() {
                    return writeFile(file, conent);
                });
            }
            else {
                return writeFile(file, conent);
            }
        }
    }, config);
};

/**
 * @param maxActiveTasks
 * @param [stopped=false]
 * @returns {{addTask: Function, check: Function}}
 */
BuildLib.getTasksQueue = function(maxActiveTasks, stopped) {
    var queueArray = [];
    var activeCount = 0;
    var queueDef = Q.defer();
    var wasStopped = stopped;
    
    var queue = {
        addTask: function(task) {
            var def = Q.defer();
            queueArray.push([def, task]);
            if (!stopped) {
                queue.check();
            }
            return def.promise;
        },
        check: function() {
            var oldQueueDef = queueDef;
            if (!queueArray.length) {
                queueDef.resolve();
                queueDef = Q.defer();
                if (wasStopped) {
                    stopped = true;
                }
                return oldQueueDef.promise;
            }
            if (activeCount < maxActiveTasks) {
                var task = queueArray.shift();
                ++activeCount;
                task[1]().then(function(result) {
                    --activeCount;
                    task[0].resolve(result);
                    if (!stopped) {
                        queue.check();
                    }
                }).done();
            }
            return oldQueueDef.promise;
        },
        start: function(preventStopping) {
            if (preventStopping) {
                wasStopped = false;
            }
            stopped = false;
            return queue.check();
        }
    };
    return queue;
};