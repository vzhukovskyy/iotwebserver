module.exports = {
    authenticateIfNotAuthenticated: function(req, res) {
        return authenticateIfNotAuthenticatedDigest(req, res);
        //return authenticateIfNotAuthenticatedBasic(req, res);
    },
    
    
};

var crypt = require('crypto');

var credentials = {
    userName: 'user123',
    password: 'pass123',
    realm: 'Digest Authentication'
};
var hash = cryptoUsingMD5(credentials.realm);


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
        
        if(authInfo.username === credentials.userName) {
            var digestAuthObject = {};
            digestAuthObject.ha1 = cryptoUsingMD5(authInfo.username + ':' + credentials.realm + ':' + credentials.password);
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
    
    //console.log({ 'WWW-Authenticate': 'Digest realm="' + credentials.realm + '",qop="auth",nonce="' + Math.random() + '",opaque="' + hash + '"' });
    res.writeHead(401, { 'WWW-Authenticate': 'Digest realm="' + credentials.realm + '",qop="auth",nonce="' + Math.random() + '",opaque="' + hash + '"' });
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

        if (authInfo.username === credentials.userName && authInfo.password === credentials.password) {
            // authenticated
            return true;
        }
    }
    
    // not authenticated
    
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Secure Area"' });
    res.end('<html><body>Authorization is needed.</body></html>');
    return false;
}




