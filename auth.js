module.exports = {
    authenticateIfNotAuthenticated: function(req, res) {
        return authenticateIfNotAuthenticatedDigest(req, res);
        //return authenticateIfNotAuthenticatedBasic(req, res);
    },
    getUsername: function(req) {
        if(!req) {
            // special case for logging system activities
            return 'system';
        }
        
        var s = req.headers.authorization;
        if(s) {
            var startIndex = s.indexOf('username=');
            var endIndex = s.indexOf(',', startIndex);
            return s.substr(startIndex+10, endIndex-1-startIndex-10);
        }
        return '<unknown>';
    }
};

var crypt = require('crypto');
var fs = require('fs');

var userCredentials = readUserCredentials();
//console.log(userCredentials);

var realm = 'Digest realm';
var hash = cryptoUsingMD5(realm);

function readUserCredentials() {
    var buffer = fs.readFileSync('/node_app_slot/private-data/accounts.json', 'utf8');
    if(!buffer) {
        buffer = fs.readFileSync('/node_app_slot/generic-data/accounts.json', 'utf8');
    }
    return JSON.parse(buffer);
}

function findUserCredentials(username) {
    var credentials;
    userCredentials.find(function(cred) {
        if(cred.username === username) {
            credentials = cred;
        }
    });
    
    //console.log('findUserCredentials:',credentials);
    return credentials;
}

function cryptoUsingMD5(data) {
    return crypt.createHash('md5').update(data).digest('hex');
}

function authenticateIfNotAuthenticatedDigest(req, res) {
    if(req.headers.authorization && req.headers.authorization.startsWith('Digest ')) {
        var authData = req.headers.authorization.substr(7);
    
        var authInfo = {};
        authData.split(', ').forEach(function (d) {
            d = d.split('=');

            if(d.length === 2) {
                authInfo[d[0]] = d[1].replace(/"/g, '');
            }
        });
        //console.log(JSON.stringify(authInfo));
        
        var credentials = findUserCredentials(authInfo.username);
        if(credentials) {
            var digestAuthObject = {};
            digestAuthObject.ha1 = cryptoUsingMD5(credentials.username + ':' + realm + ':' + credentials.password);
            digestAuthObject.ha2 = cryptoUsingMD5(req.method + ':' + authInfo.uri);
            var resp = cryptoUsingMD5([digestAuthObject.ha1, authInfo.nonce, authInfo.nc, authInfo.cnonce, authInfo.qop, digestAuthObject.ha2].join(':'));
            digestAuthObject.response = resp;
            
            if(authInfo.response === digestAuthObject.response) {
                // authenticated
                return true;
            }
        }
    }
    
    // not authenticated
    
    res.writeHead(401, { 'WWW-Authenticate': 'Digest realm="' + realm + '",qop="auth",nonce="' + Math.random() + '",opaque="' + hash + '"' });
    res.end('Authorization is needed.');
    return false;
}

function authenticateIfNotAuthenticatedBasic(req, res) {
    if(req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
        var data = req.headers.authorization.substr(6);   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
        var buf = new Buffer(data, 'base64'); // create a buffer and tell it the data coming in is base64
        var plain_auth = buf.toString();	// read it back out as a string

        //console.log("Decoded Authorization ", plain_auth);

        var creds = plain_auth.split(':');      // split "username:password" 
        var authInfo = {
            username : creds[0],
            password : creds[1]
        }

        if (authInfo.username === credentials.username && authInfo.password === credentials.password) {
            // authenticated
            return true;
        }
    }
    
    // not authenticated
    
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
    res.end('<html><body>Authorization is needed.</body></html>');
    return false;
}




