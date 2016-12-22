// keep these lines (below) for proper jshinting and jslinting
/*jslint node:true, vars:true, bitwise:true */
/*jshint unused:true, undef:true */
// see http://www.jslint.com/help.html and http://jshint.com/docs

var fs = require('fs');
var http = require('http');
var https = require('https');
var net = require('./nettools');
var auth = require('./auth');
var controller = require('./controller.js');

var privateKey = fs.readFileSync('/node_app_slot/ssl/server.pem');
var certificate = fs.readFileSync('/node_app_slot/ssl/server.crt');
var ca = [fs.readFileSync('/node_app_slot/ssl/bundle_01.crt'), 
          fs.readFileSync('/node_app_slot/ssl/bundle_02.crt'), 
          fs.readFileSync('/node_app_slot/ssl/bundle_03.crt')];
var httpsOpts = { key: privateKey, cert: certificate, ca: ca };

var httpPort = 80;
var httpsPort = 443;

// http server redirecting to https
http.createServer(function(req, res){    
    res.writeHead(302,  {Location: "https://rudiki.pp.ua"})
    res.end();
}).listen(httpPort); // listen all interfaces

https.createServer(httpsOpts, function (req, res) {
    console.log('Handling request method',req.method,'url',req.url);
    console.log('Headers',req.headers);
    
    if(!auth.authenticateIfNotAuthenticated(req, res)) {
        console.log('No authorization data, responded 401');
        return;
    }
    
    console.log('Request authorized');
    
    if(req.url.startsWith('/api/')) {
        controller.handleApiCall(req, res);
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
    
}).listen(httpsPort); // listen all interfaces

console.log('Server listening on addresses');
var ipAddresses = net.getExternalIpAddresses();
ipAddresses.forEach(function(ip) {
    console.log(ip+':'+httpPort);
    console.log(ip+':'+httpsPort);
})

