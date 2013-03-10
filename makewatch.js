//Detect when any file has changed in the src folder and invoke make to
//regenerate pythia.js

var fs   = require('fs');
var exec = require('child_process').exec;

function watcher(event, filename) {
    exec('make', function (error, stdout, stderr) {
        if (stdout) {
            console.log('STDOUT\n', stdout);
        }
        if (stderr) {
            console.log('STDERR\n', stderr);
        }

        if (error !== null) {
            console.log('ERROR\n', error);
        }
    });
};


fs.watch('src', watcher);
fs.watch('Makefile', watcher);
