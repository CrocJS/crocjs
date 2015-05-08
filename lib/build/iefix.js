var postcss = require('postcss');

var reRGBA         = /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d\.]+\s*)/gi;
var reALL_PSEUDO   = /::(before|after|first-line|first-letter)/gi;
var reBLANK_LINE   = /(\r\n|\n|\r)(\s*?\1)+/gi;

//伪元素只保留一个冒号
var removeColons = function(rule, i) {
    if (rule.selector.match(reALL_PSEUDO)) {
        rule.selector = rule.selector.replace(/::/g, ':');
    }
}

/**
 * IE opacity hack
 * 转换为 IE filter
 */
function ieOpacityHack(decl, i) {
    //四舍五入
    var amount = Math.round(decl.value * 100);
    if (decl.prop == 'opacity') {
        
        var reBefore = decl.before.replace(reBLANK_LINE, '$1')
        
        insertDecl(decl, i, {
            before: reBefore,
            prop: '-ms-filter',
            value: '\'progid:DXImageTransform.Microsoft.Alpha(Opacity=' + amount + ')\''
        });
    }
}

/**
 * IE rgba hack
 * background rgba 转换为 IE ARGB
 */
function ieRgbaHack(decl, i) {
    //十六进制不足两位自动补 0
    function pad(str) {
        return str.length == 1 ? '0' + str : '' + str;
    }
    if ((decl.prop == 'background' || decl.prop == 'background-color') &&
        decl.value.match(reRGBA)) {
        // rgba 转换为 AARRGGBB
        var colorR = pad(parseInt(RegExp.$1).toString(16));
        var colorG = pad(parseInt(RegExp.$2).toString(16));
        var colorB = pad(parseInt(RegExp.$3).toString(16));
        var colorA = pad(parseInt(RegExp.$4 * 255).toString(16));
        var ARGB   = "'" + "#" + colorA + colorR + colorG + colorB + "'";
        
        // 插入IE半透明滤镜
        var reBefore = decl.before.replace(reBLANK_LINE, '$1')
        insertDecl(decl, i, {
            before: reBefore,
            prop: 'filter',
            value: 'progid:DXImageTransform.Microsoft.gradient(startColorstr=' + ARGB + ', endColorstr=' + ARGB + ')'
        });
        
        // IE9 rgba 和滤镜都支持，插入 :root hack 去掉滤镜
        var newSelector = ':root ' + decl.parent.selector;
        
        var nextrule = postcss.rule({
            selector: newSelector
        });
        decl.parent.parent.insertAfter(decl.parent, nextrule);
        nextrule.append({
            prop: 'filter',
            value: 'none\\9'
        });
    }
}


//在后面插入新的属性，并保持注释在当前行
function insertDecl(decl, i, newDecl) {
    var next = decl.next(),
        declAfter;
    if (next && next.type == 'comment' && next.before.indexOf('\n') == -1) {
        declAfter = next;
    } else {
        declAfter = decl;
    }
    decl.parent.insertAfter(declAfter, newDecl)
}

var cssgraceRule = function(rule, i) {
    //遍历 selectors
    removeColons(rule, i);
    
    //遍历 decl
    rule.eachDecl(function(decl, i) {
        ieOpacityHack(decl, i);
        ieRgbaHack(decl, i);
    });
};

// PostCSS Processor
var cssprocess = function(css, opts) {
    css.eachRule(cssgraceRule);
}

exports.postcss = cssprocess