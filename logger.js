var auth = require('./auth');
var fs = require('fs');

module.exports = {
    log: function(message, req) {
        var s = String(new Date())+' '+auth.getUsername(req)+' '+message;
        console.log(s);
        fs.appendFile('/node_app_slot/messages.log', s+'\n');
    },
    logStartup: function() {
        module.exports.log('-----------------------------');
        module.exports.log('       Server start-up       ');
        module.exports.log('-----------------------------');
    }
};
