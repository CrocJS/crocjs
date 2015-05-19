process.umask(parseInt('000', 8));

var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');

var configPath = process.argv[2];
var protoPath = process.argv[3];
var proto = process.argv[4];
var config = require(configPath);
var rootDir = path.resolve(path.dirname(configPath), config.general.root || '');
var publicDir = path.resolve(rootDir, config.general.site || '');

var cache = _.contains(process.argv, '--cache');
var isStatic = _.contains(process.argv, '--css');
var device = _.contains(process.argv, '--mobile') ? 'mobile' : 'desktop';
var htmlFile = path.join(publicDir, 'proto', proto + /*'.' + device +*/ '.html');
var htmlDir = path.dirname(htmlFile);
var cacheDir = path.join(publicDir, 'proto/cache');
var outputDir = path.join(cacheDir, path.dirname(proto), device);

if (cache && fs.existsSync(htmlFile)) {
    console.log(fs.readFileSync(htmlFile).toString());
}
else {
    config.use = (config.use || []).concat((config.apps || []).map(function(x) { return x.path; }));
    config.apps = [
        {
            path: '/' + path.join(path.relative(rootDir, protoPath), proto)
        }
    ];
    config.general.compiled = outputDir;
    config.general.resources = path.join(cacheDir, 'res');
    if (!config.general.rendererMode) {
        config.general.skipResources = true;
    }
    config.general.rendererMode = true;
    
    fs.mkdirsSync(htmlDir);
    global.Stm = {env: {device: device, ldevice: device}};
    require('./apps').buildApps({
        config: config,
        path: configPath,
        prototype: true,
        'static': isStatic
    }, function(err, apps) {
        if (err) {
            throw err;
        }
        var content = apps[0].createPage().renderString('index');
        fs.writeFileSync(htmlFile, content);
        console.log(content);
    });
}