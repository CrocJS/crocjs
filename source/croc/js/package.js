//+ignore croc
//+use bower:jquery

if (global.crocDerbyRendererMode) {
    process.env.DERBY_RENDERER = true;
}

var renderer = require('../../../');

global._ = require('lodash');
if (typeof window === 'undefined') {
    global.window = global;
}
if (typeof croc === 'undefined') {
    global.croc = {
        isServer: renderer.util.isServer,
        isClient: !renderer.util.isServer
    };
}