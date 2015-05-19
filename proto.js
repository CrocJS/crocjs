var http = require('http');
var url = require('url');
var fs = require('fs');
var execSync = require('child_process').execSync;
var path = require('path');
var _ = require('lodash');
var express = require('express');

module.exports = function(configPath, protoPath, cssOnly) {
    var config = require(configPath);
    var port = _.contains(process.argv, '-p') ? 80 : 9009;
    
    var exprApp = express();
    if (!config.apps) {
        config.apps = [{path: '!!' + path.join(__dirname, 'source/croc')}];
    }
    require('./apps').resolveApps({config: config, path: configPath}, function(err, apps) {
        if (err) {
            throw err;
        }
        require('./middleware')(exprApp, apps, true);
        exprApp
            .use(function(req, res) {
                var parsedUrl = url.parse(req.url, true);
                if (!fs.existsSync(path.join(protoPath, parsedUrl.pathname))) {
                    res.end('File not found!');
                    return;
                }
                try {
                    res.end(execSync('node ' + __dirname + '/render-proto.js ' + configPath + ' ' + protoPath + ' ' +
                    parsedUrl.pathname + ' ' +
                    ('cache' in parsedUrl.query ? '--cache' : '') +
                    ('css' in parsedUrl.query || cssOnly ? '--css' : '')));
                }
                catch (e) {
                    res.end(e.stack);
                }
            })
            .listen(port, function(err) {
                if (err) {
                    throw err;
                }
                console.log('http://localhost:' + port + '/');
            });
    });
};