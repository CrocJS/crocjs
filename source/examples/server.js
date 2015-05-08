var http = require('http');
var _ = require('lodash');
var liveDbMongo = require('livedb-mingo');
var express = require('express');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var highway = require('racer-highway');

var derby = require('./../../index');

derby.run(function() {
    _.defaults(process.env, require('./config/defaults'));
    
    var store = derby.createStore({
        db: liveDbMongo()
    });
    var handlers = highway(store);
    
    require('./../../apps').buildApps({
        path: __dirname + '/croc.js',
        store: store
    }, function(err, apps) {
        if (err) {
            throw err;
        }
        
        var expressApp = express()
            .use(compression())
            .use(store.modelMiddleware())
            .use(cookieParser())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({extended: true}))
            .use(handlers.middleware);
        
        require('../../middleware')(expressApp, apps);
        
        var server = http.createServer(expressApp);
        server.on('upgrade', handlers.upgrade);
        return server.listen(process.env.PORT, function() {
            return console.log('%d listening. Go to: http://localhost:%d/', process.pid, process.env.PORT);
        });
    });
});