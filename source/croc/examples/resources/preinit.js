(function() {
    var rwebkit = /(webkit)[ \/]([\w.]+)/,
        ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
        rmsie = /(msie) ([\w.]+)/,
        rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/;

    var uaMatch = function(ua) {
        ua = ua.toLowerCase();

        var match = rwebkit.exec(ua) ||
            ropera.exec(ua) ||
            rmsie.exec(ua) ||
            ua.indexOf("compatible") < 0 && rmozilla.exec(ua) ||
            [];

        return { browser: match[1] || "", version: match[2] || "0" };
    };
    var browser = {};

    var browserMatch = uaMatch(navigator.userAgent);
    if (browserMatch.browser) {
        browser[ browserMatch.browser ] = true;
        browser.version = browserMatch.version;
    }

    if (browser.webkit) {
        browser.safari = true;
    }

//browsers
    document.documentElement.className += ' ' + (
        browser.webkit ? (navigator.userAgent.match(/Chrome/) ? 'chrome webkit' : 'safari webkit') :
            browser.opera ? 'presto' :
                browser.msie ? 'trident ie' + browser.version.match(/^\d+/)[0] :
                    navigator.userAgent.match(/Trident/) ? 'trident ie11' :
                        browser.mozilla ? 'gecko' : ''
        );
    document.documentElement.className += ' ' + (
        navigator.platform.match(/win/i) ? 'win' :
            navigator.platform.match(/mac/i) ? 'mac' :
                navigator.platform.match(/linux/i) ? 'linux' : ''
        );

    if (browser.msie && browser.version.match(/^\d+/)[0] === '8') {
        //noinspection JSHint
        document.write('<script src="/d/js/vendor/es5-shim/es5-shim.js"></script>');
    }
})();