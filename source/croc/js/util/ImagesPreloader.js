/**
 * Класс, отвечающий за предзагрузку изображений
 */
croc.Class.define('croc.util.ImagesPreloader', {
    extend: croc.Object,
    
    statics: {
        /**
         * @private
         * @static
         */
        __loadedImages: {},
        
        /**
         * @private
         * @static
         */
        __loadingImages: {},
        
        /**
         * Загрузить изображение/изображения
         * @param {string|jQuery|Element|Array.<string|Element>} image
         * @param {boolean} [returnDeferred=false]
         * @returns {$.Deferred}
         */
        load: function(image, returnDeferred) {
            if (!croc.isClient) {
                return null;
            }
            if (returnDeferred) {
                return new croc.util.ImagesPreloader().add(image, true);
            }
            if (!this.__instance) {
                this.__instance = new croc.util.ImagesPreloader();
            }
            this.__instance.add(image);
            return null;
        }
    },
    
    events: {
        /**
         * загрузка всех изображений из очереди завершена
         */
        finished: null,
        
        /**
         * очередное изображение загружено
         * @param {string} image
         * @param {number} loaded
         * @param {number} total
         */
        imageLoaded: null
    },
    
    properties: {
        /**
         * Все изображения загружены
         * @type {boolean}
         */
        loaded: {
            __setter: null,
            value: true,
            event: true
        }
    },
    
    options: {
        /**
         * Максимальное время загрузки изображений
         * @type {number}
         */
        maxLoadTime: null
    },
    
    construct: function(options) {
        this.__loadedImages = {};
        this.__loading = false;
        this.__loadedCount = 0;
        this.__total = 0;
        this.__loadDisposer = new croc.util.Disposer();
        this.__maxLoadTime = options.maxLoadTime;
        this.__notLoaded = {};
        
        croc.util.ImagesPreloader.superclass.__construct__.apply(this, arguments);
    },
    
    members: {
        /**
         * Добавить изображение/изображения в очередь загрузки. Опционально возвращает deferred, который будет
         * инициирован при загрузке только переданных изображений
         * @param {string|jQuery|Element|Array.<string|Element>} image
         * @param {boolean} [returnDeferred=false]
         */
        add: function(image, returnDeferred) {
            if (image instanceof jQuery) {
                image = image.get();
            }
            else if (!Array.isArray(image)) {
                image = [image];
            }
            
            var listenImage = function(img) {
                var listener = this.on('imageLoaded', function(curSrc, error) {
                    if (img.src === curSrc) {
                        img.$$error = error;
                        this.un(listener);
                    }
                }, this);
            }.bind(this);
            
            var imagesToAwait = {};
            image = image.filter(function(img) {
                var src = typeof img === 'string' ? img : img.src;
                if (src in this.__loadedImages && _.isElement(img)) {
                    img.$$error = !this.__loadedImages[src];
                    return false;
                }
                
                imagesToAwait[src] = true;
                
                if (this.__notLoaded[src] && _.isElement(img)) {
                    listenImage(img);
                }
                
                return !this.__notLoaded[src];
            }, this);
            
            if (image.length > 1) {
                var oldImage = image;
                image = _.uniq(image, function(img) {
                    return typeof img === 'string' ? img : img.src;
                });
                if (oldImage.length !== image.length) {
                    _.difference(oldImage, image).forEach(function(img) {
                        if (_.isElement(img)) {
                            listenImage(img);
                        }
                    });
                }
            }
            
            this.__total += image.length;
            this.__setLoaded(false);
            
            var result = null;
            if (returnDeferred) {
                if (Object.keys(imagesToAwait).length === 0) {
                    result = $.Deferred().resolve();
                }
                else {
                    result = $.Deferred();
                    
                    var listener = this.on('imageLoaded', function(src) {
                        delete imagesToAwait[src];
                        if (Object.keys(imagesToAwait).length === 0) {
                            result.resolve();
                            this.un(listener);
                        }
                    }, this);
                }
            }
            
            if (image.length) {
                if (this.__maxLoadTime && !this.__loadTimeout) {
                    this.__loadTimeout = this.__loadDisposer.setTimeout(function() {
                        this.__loadTimeout = null;
                        if (!this.getLoaded()) {
                            _.forOwn(this.__notLoaded, function(val, src) {
                                this.__imageLoaded(src, true);
                            }, this);
                            this.__onFinished();
                        }
                    }.bind(this), this.__maxLoadTime);
                }
                
                this.__loadImages(image);
            }
            return result;
        },
        
        /**
         * Получить объект Deferred, отражающий прогресс загрузки изображений
         * @returns {$.Deferred}
         */
        getDeferred: function() {
            var deferred = $.Deferred();
            
            if (this.getLoaded()) {
                deferred.resolve();
            }
            else {
                var listener = this.on('imageLoaded', function(image, error, loaded, total) {
                    deferred.notify(image, loaded, total);
                });
                this.once('finished', function() {
                    this.un(listener);
                    deferred.resolve();
                }, this);
            }
            
            return deferred;
        },
        
        /**
         * Количество загруженных изображений
         * @returns {number}
         */
        getLoadedCount: function() {
            return this.__loadedCount;
        },
        
        /**
         * Общее количество изображений
         * @returns {number}
         */
        getTotal: function() {
            return this.__total;
        },
        
        /**
         * Загружено ли изображение
         * @param {string} src
         * @return {boolean}
         */
        isImageLoaded: function(src) {
            return src in this.__loadedImages;
        },
        
        /**
         * Добавить в очередь все изображения из документа (html, css-файлы)
         */
        scanDocument: function() {
            var $this = this;
            var imageURLs = [];
            
            function analyzeStyleSheet(styleSheet) {
                try {
                    if (styleSheet.imports && styleSheet.imports.length > 0) {
                        for (var importIndex = 0; importIndex < styleSheet.imports.length; ++importIndex) {
                            analyzeStyleSheet(styleSheet.imports[importIndex]);
                        }
                    }
                    
                    var baseURL = $this.__getBaseURL(styleSheet.href),
                        cssRules = styleSheet.cssRules || styleSheet.rules;
                    if (!cssRules) {
                        return;
                    }
                    
                    // loop through all CSS rules
                    for (var j = 0; j < cssRules.length; j++) {
                        var cssRule = cssRules[j];
                        if (!styleSheet.imports && cssRule.styleSheet) {
                            analyzeStyleSheet(cssRule.styleSheet);
                        }
                        else if (cssRule.style && cssRule.style.cssText) {
                            // extract only image related CSS rules 
                            // parse rules string and extract image URL
                            var urls = cssRule.style.cssText.match(/[^\(]+\.(gif|jpg|jpeg|png)/g);
                            if (urls) {
                                $.each(urls, function(index, url) {
                                    url = url.replace('"', '');
                                    url = /^(https?:\/)?\//.test(url) ? url : baseURL + url;
                                    imageURLs.push(url);
                                });
                            }
                        }
                    }
                }
                catch (ex) {
                    //игнорируем security error
                }
            }
            
            for (var i = 0; i < document.styleSheets.length; i++) { // loop through all linked/inline stylesheets
                analyzeStyleSheet(document.styleSheets[i]);
            }
            
            this.add(imageURLs);
            this.scanElement();
        },
        
        /**
         * Scan element and it's children for images to load
         * @param {jQuery} [el]
         */
        scanElement: function(el) {
            var imageURLs = [];
            $('img', el).each(function() {
                var src = $(this).attr('src');
                if (src) {
                    imageURLs.push(src);
                }
            });
            if (el && el.is('img')) {
                var src = el.attr('src');
                if (src) {
                    imageURLs.push(src);
                }
            }
            this.add(imageURLs);
        },
        
        /**
         * @param cssLink
         * @returns {string}
         * @private
         */
        __getBaseURL: function(cssLink) {
            cssLink = cssLink ? cssLink : 'window.location.href'; // window.location.href for inline style definitions
            
            var urlParts = cssLink.split('/'); // split link at '/' into an array
            urlParts.pop(); // remove file path from URL array
            
            var baseURL = urlParts.join('/'); // create base URL (rejoin URL parts)
            
            if (baseURL !== "") {
                baseURL += '/'; // expand URL with a '/'
            }
            
            return baseURL;
        },
        
        /**
         * @param src
         * @param [withError=false]
         * @private
         */
        __imageLoaded: function(src, withError) {
            delete this.__notLoaded[src];
            this.__loadedImages[src] = !withError;
            ++this.__loadedCount;
            
            this.fireEvent('imageLoaded', src, !!withError, this.__loadedCount, this.__total);
            if (this.__loadedCount === this.__total) {
                this.__onFinished();
            }
            
            var loadingArr = croc.util.ImagesPreloader.__loadingImages[src];
            if (loadingArr) {
                delete croc.util.ImagesPreloader.__loadingImages[src];
                loadingArr.forEach(function(func) {
                    func(!!withError);
                });
                
                if (!withError) {
                    croc.util.ImagesPreloader.__loadedImages[src] = true;
                }
            }
        },
        
        /**
         * @private
         */
        __loadImages: function(images) {
            images.forEach(function(image) {
                var src = typeof image === 'string' ? image : image.src;
                var originalImage = _.isElement(image) && image;
                image = new Image();
                
                this.__notLoaded[src] = true;
                
                if (croc.util.ImagesPreloader.__loadedImages[src]) {
                    if (originalImage) {
                        originalImage.$$error = false;
                    }
                    this.__imageLoaded(src);
                    return;
                }
                
                if (croc.util.ImagesPreloader.__loadingImages[src]) {
                    croc.util.ImagesPreloader.__loadingImages[src].push(function(withError) {
                        if (originalImage) {
                            originalImage.$$error = withError;
                        }
                        this.__imageLoaded(src, withError);
                    }.bind(this));
                    return;
                }
                
                croc.util.ImagesPreloader.__loadingImages[src] = [];
                
                this.__loadDisposer.addListener($(image), 'onreadystatechange load error', function(e) {
                    if (originalImage) {
                        originalImage.$$error = e.type === 'error';
                    }
                    this.__imageLoaded(src, e.type === 'error');
                }.bind(this));
                image.src = src;
            }.bind(this));
        },
        
        /**
         * @private
         */
        __onFinished: function() {
            this.__loadDisposer.disposeAll();
            this.__loadTimeout = null;
            this.__setLoaded(true);
            this.fireEvent('finished');
        }
    }
});
