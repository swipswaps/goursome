#!/usr/bin/env node

var util = require('util'),
    spawn = require('child_process').spawn,
    querystring = require('querystring'),
    path = process.argv[2],
    http = require('http');

try {
    process.chdir(path);
} catch (e) {
    console.log("Bad dir argument ["+path+"]");
    process.exit(1);
}

// initial data population
var log = spawn('git', ['log',  '--pretty=format:user:%aN%n%ct', '--reverse', '--raw', '--encoding=UTF-8', '--no-renames']);
log.stdout.on('data', function(data) {
    process.stdout.write(data);
});

log.on('exit', function(code) {
    if (code) throw new Error('Bad Code: '+code);
});

http.createServer(function(req, res) {
    // simply listen out for POST requests
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            var postvars = querystring.parse(body);

            //process.stdout.write(postvars.revdata);
            if (postvars.oldrev && postvars.newrev) {
                updateLog(postvars.oldrev, postvars.newrev);
            } else {
                res.writeHead(500, {'Content-Type' : 'text/plain'});
                res.end('Missing required parameters\n');
            }

            res.writeHead(200, {'Content-Type' : 'text/plain'});
            res.end('OK\n');
        });
    } else {
        res.writeHead(200, {'Content-Type' : 'text/plain'});
        res.end('Use POST instead\n');
    }
}).listen(2424);

var updateLog = function(oldrev, newrev) {
    //
    spawn('git', ['pull']).on('exit', function(code) {
        if (code) throw new Error('Bad Code: '+code);

        var log = spawn('git', ['log',  '--pretty=format:user:%aN%n%ct', '--reverse', '--raw', '--encoding=UTF-8', '--no-renames', oldrev+'..'+newrev]);

        log.stdout.on('data', function(data) {
            process.stdout.write(data);
        });
    });
}
