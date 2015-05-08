var fs = require('fs');
var path = require('path');
var fork = require('child_process').fork;

function getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function(file) {
        return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
}

getDirectories(__dirname + '/../').forEach(function(dir) {
    if (dir !== 'prototypes' && dir !== 'resources') {
        fork('buildscript', [dir]);
    }
});