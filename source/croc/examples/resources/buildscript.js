var fs = require('fs');
var path = require('path');
var jsdep = require('jsDependencyAnalizer');
var Browserify = require('browserify');
var debowerify = require('debowerify');

var dir = process.argv[2];
jsdep.build({
    path: __dirname + '/jsdep.js',
    target: 'example',
    abspath: true,
    add: '!!' + __dirname + '/../' + dir + '/index.html'
}).then(function(target) {
    var bundle = new Browserify([], {debug: true});
    bundle.transform(debowerify, {
        global: true,
        bowerOptions: {cwd: __dirname + '/../../../../'}
    });
    bundle.add(target.files);
    bundle.bundle(function(err, file) {
        if (err) {
            throw err;
        }
        fs.writeFileSync(__dirname + '/../' + dir + '/index.js', file);
    });
}).done();