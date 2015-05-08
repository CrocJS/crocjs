var serveStatic = require('serve-static');
var path = require('path');
var _ = require('lodash');
module.exports = function(express, apps, skipRouter) {
    var sitesServed = {};
    var usesServed = {};
    apps.forEach(function(app) {
        if (!sitesServed[app.sitePath]) {
            express.use(serveStatic(app.sitePath));
            sitesServed[app.sitePath] = true;
        }
        if (app.uses) {
            app.uses.forEach(function(using) {
                if (!usesServed[using]) {
                    express.use('/' + path.basename(using) + '/images/', serveStatic(path.join(using, 'images')));
                }
            });
        }
        express.use('/' + app.name + '/images/', serveStatic(path.join(app.path, 'images')));
    });
    if (!process.env.DERBY_RENDERER) {
        if (!skipRouter) {
            express.use('/croc/images/', serveStatic(__dirname + '/source/croc/images'));
        }
        apps.forEach(function(app) {
            express.use(app.router());
            _.forEach(app.packages, function(packApp) {
                express.use(packApp.router());
            });
        });
    }
};