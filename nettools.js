module.exports = {
 
    getExternalIpAddresses : function () {
        var ips = [];

        var os = require('os');
        var ifaces = os.networkInterfaces();

        Object.keys(ifaces).forEach(function (ifname) {

            ifaces[ifname].forEach(function (iface) {
                if ('IPv4' === iface.family && iface.internal === false) {
                    ips.push(iface.address);
                }
            });

        });

        //console.log(ips);
        return ips;
    }

};
