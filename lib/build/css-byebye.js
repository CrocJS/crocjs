function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


function regexize(rulesToRemove) {
    var rulesRegexes = []
    for (var i = 0, l = rulesToRemove.length; i < l; i++) {
        if (typeof rulesToRemove[i] == 'string') {
            rulesRegexes.push(new RegExp('^\s*' + escapeRegExp(rulesToRemove[i]) + '\s*$'))
        }
        else {
            rulesRegexes.push(rulesToRemove[i])
        }
    }
    return rulesRegexes
}


function concatRegexes(regexes) {
    
    var rconcat = ''
    
    if (Array.isArray(regexes)) {
        
        for (var i = 0, l = regexes.length; i < l; i++) {
            rconcat += regexes[i].source + '|'
        }
        
        rconcat = rconcat.substr(0, rconcat.length - 1)
        
        return new RegExp(rconcat)
    }
}


module.exports = function(options) {
    var selectors = options.selectors;
    return function(css, options) {
    
        var remregexes = regexize(selectors)
        var regex = concatRegexes(remregexes)
        var count = 0
    
        var filterRule = function filterRule(rule) {
        
            var selectors = rule.selectors
            var filtered = []
        
            for (var j = 0, len = selectors.length; j < len; j++) {
                if (selectors[j].match(regex) === null) {
                    filtered.push(selectors[j])
                }
            }
        
            if (filtered.length > 1) {
                rule.selector = filtered.join(', ')
            }
            else if (filtered.length == 1) {
                rule.selector = filtered[0].trim()
            }
            else {
                rule.removeSelf()
            }
        }
    
        css.eachRule(filterRule)
    };
};
