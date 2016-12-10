module.exports = {
 
    getAnyExternalIpAddress : function () {
        var ip;

        var os = require('os');
        var ifaces = os.networkInterfaces();

        Object.keys(ifaces).forEach(function (ifname) {

            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' === iface.family && iface.internal === false) {
                    ip = iface.address;
                }
            });

        });

        console.log(ip);
        return ip;
    }

};
