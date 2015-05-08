/**
 * Определение браузера и его версии
 * @static
 */
croc.Class.define('croc.util.Browser', {
    type: 'static',
    
    statics: {
        /**
         * @private
         * @static
         */
        __ua: null,
        
        /**
         * @param {String} browser
         * @param {Array|String|number} [versionCondition]
         * @returns {Boolean}
         * @static
         */
        check: function(browser, versionCondition) {
            if (this.getName() === browser) {
                if (versionCondition) {
                    var conditions;
                    if (!Array.isArray(versionCondition)) {
                        conditions = [versionCondition];
                    }
                    else {
                        conditions = versionCondition;
                    }
                    
                    return conditions.every(function(condition) {
                        condition = condition.toString();
                        var sign = condition.match(/[<>=]*/)[0];
                        var version = parseInt(condition.replace(sign, ''), 10);
                        
                        switch (sign) {
                            case '<':
                                return this.getVersion() < version;
                            case '<=':
                                return this.getVersion() <= version;
                            case '>':
                                return this.getVersion() > version;
                            case '>=':
                                return this.getVersion() >= version;
                            default:
                                return this.getVersion() === version;
                        }
                    }.bind(this));
                }
                return true;
            }
            return false;
        },
        
        /**
         * @returns {String}
         * @static
         */
        getName: function() {
            return this.__uaMatch(navigator.userAgent).browser;
        },
        
        /**
         * @returns {Number}
         * @static
         */
        getVersion: function() {
            return parseInt(this.__uaMatch(navigator.userAgent).version, 10);
        },
        
        /**
         * @returns {Boolean}
         * @static
         */
        isChrome: function() {
            return this.check('chrome');
        },
        
        /**
         * @returns {Boolean}
         * @static
         */
        isFirefox: function() {
            return this.check('mozilla');
        },
        
        /**
         * @param {Array|String|number} [versionCondition]
         * @returns {Boolean}
         * @static
         */
        isIE: function(versionCondition) {
            return this.check('msie', versionCondition);
        },
        
        /**
         * @param {Array|String|number} [versionCondition]
         * @returns {Boolean}
         * @static
         */
        isOpera: function(versionCondition) {
            return this.check('opera', versionCondition);
        },
        
        /**
         * @returns {Boolean}
         * @static
         */
        isSafari: function() {
            return this.check('safari');
        },
        
        /**
         * @private
         * @static
         */
        __uaMatch: function(ua) {
            if (!this.__ua) {
                var rwebkit = /(webkit)[ \/]([\w.]+)/,
                    ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
                    rmsie = /(msie) ([\w.]+)/,
                    rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;
                
                ua = ua.toLowerCase();
                
                var match = rwebkit.exec(ua) ||
                    ropera.exec(ua) ||
                    rmsie.exec(ua) ||
                    ua.indexOf("compatible") < 0 && rmozilla.exec(ua) ||
                    [];
                
                if (match[1] !== 'msie' && ua.match(/trident/)) {
                    match[1] = 'msie';
                }
                else if (match[1] === 'webkit') {
                    match[1] = /chrome/.test(ua) ? 'chrome' : 'safari';
                }
                
                this.__ua = {browser: match[1] || "", version: match[2] || "0"};
            }
            
            return this.__ua;
        }
    }
});