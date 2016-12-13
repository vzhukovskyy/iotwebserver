// keep these lines (below) for proper jshinting and jslinting
/*jslint node:true, vars:true, bitwise:true */
/*jshint unused:true, undef:true */
// see http://www.jslint.com/help.html and http://jshint.com/docs

var fs = require('fs');
var http = require('http');
var https = require('https');
var net = require('./nettools');
var auth = require('./auth');
var hw = require('./hardware');

var pk = fs.readFileSync('/node_app_slot/privatekey.pem');
var pc = fs.readFileSync('/node_app_slot/certificate.pem');
var httpsOpts = { key: pk, cert: pc };

var ipAddress = net.getAnyExternalIpAddress();
var port = 8080;


//https.createServer(httpsOpts, function (req, res) {
http.createServer(function (req, res) {
    console.log('Handling request method',req.method,'url',req.url);
    console.log('Headers',req.headers);
    
    if(!auth.authenticateIfNotAuthenticated(req, res)) {
        console.log('No authorization data, responded 401');
        return;
    }
    
    console.log('Request authorized');
    
    if(req.url.startsWith('/api/')) {
        handleApiCall(req, res);
    }
    else if (req.method == 'GET') {
        if (req.url.indexOf('.css') != -1) {
            var css = fs.readFileSync('/node_app_slot/styles.css') ;
            
            res.writeHead(200, {'Content-Type': 'text/css'});
            res.end(css);
        }
        else if (req.url == '/' || req.url == '/index.html' || req.url === '/index.htm') {
            var lightSensorPage = fs.readFileSync('/node_app_slot/index.html', 'utf-8') ;

            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(lightSensorPage);
        }
        else {
            res.writeHead(410, {});
            res.end();
        }
    }
    else {
        res.writeHead(410, {});
        res.end();
    }
    
}).listen(port, ipAddress);

console.log('Server listening on '+ipAddress+':'+port);
return;

function handleApiCall(req, res) {
    var apiUrl = req.url.substr(5);
    console.log('handling API call',apiUrl);
    
    if(req.method == 'POST') {
        var jsonString = '';

        req.on('data', function (data) {
            jsonString += data;
        });

        req.on('end', function () {
            var json = JSON.parse(jsonString);
            console.log(json);
            
            hw.write(json.switch, json.state);
            
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<!doctype html><html><head><title>response</title></head><body>');
            res.write('Accepted request to change switch state to '+json.state);
            res.end('</body></html>');
        });
        
    }
    else if(req.method == 'GET') {
        var states = hw.read();
        var jsonString = JSON.stringify(states);

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(jsonString);
        
    }
}

