module.exports = {
    authenticateIfNotAuthenticated: function(req, res) {
        return authenticateIfNotAuthenticatedDigest(req, res);
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
    if(!req.headers.authorization) {
        authenticateUserDigest(res); // 401
        return false;
    }
    
    var authInfo = req.headers.authorization.replace(/^Digest /, '');
    authInfo = parseAuthenticationInfoDigest(authInfo);
    
    if (authInfo.username !== credentials.userName) {
        authenticateUserDigest(res); 
        return false;
    }
    
    var digestAuthObject = {};
    digestAuthObject.ha1 = cryptoUsingMD5(authInfo.username + ':' + credentials.realm + ':' + credentials.password);
    digestAuthObject.ha2 = cryptoUsingMD5(req.method + ':' + authInfo.uri);
    var resp = cryptoUsingMD5([digestAuthObject.ha1, authInfo.nonce, authInfo.nc, authInfo.cnonce, authInfo.qop, digestAuthObject.ha2].join(':'));
    digestAuthObject.response = resp;
    
    if (authInfo.response !== digestAuthObject.response) {
        authenticateUserDigest(response); 
        return false;
    }

    return true;
}

function authenticateUserBasic(res) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="need login"' });
    res.end('Authorization is needed.');
}

function authenticateUserDigest(res) {
    console.log({ 'WWW-Authenticate': 'Digest realm="' + credentials.realm + '",qop="auth",nonce="' + Math.random() + '",opaque="' + hash + '"' });
    res.writeHead(401, { 'WWW-Authenticate': 'Digest realm="' + credentials.realm + '",qop="auth",nonce="' + Math.random() + '",opaque="' + hash + '"' });
    res.end('Authorization is needed.');
}

function parseAuthenticationInfoBasic(authData) {
    var tmp = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part

    var buf = new Buffer(tmp[1], 'base64'); // create a buffer and tell it the data coming in is base64
    var plain_auth = buf.toString();	// read it back out as a string

    console.log("Decoded Authorization ", plain_auth);

    // At this point plain_auth = "username:password"

    var creds = plain_auth.split(':');      // split on a ':'
    var username = creds[0];
    var password = creds[1];
}
    
function parseAuthenticationInfoDigest(authData) {
    var authenticationObj = {};
    authData.split(', ').forEach(function (d) {
        d = d.split('=');
 
        authenticationObj[d[0]] = d[1].replace(/"/g, '');
    });
    console.log(JSON.stringify(authenticationObj));
    return authenticationObj;
}

