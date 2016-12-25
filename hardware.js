module.exports = {
    write: function(index, state) {
        if(0 <= index && index <= 1) {
            io[index].write(state ? 1 : 0);
        }
    },
    
    read: function() {
        return [io[0].read(), io[1].read()];
    },
    
    getSwitchName: function(index) {
        return names[index];
    }
};

var mraa = require("mraa");

var io = [new mraa.Gpio(11, true, false), new mraa.Gpio(9, true, false)];
var names = ['light', 'unconnected'];

// configure the LED gpio as an output
io[0].dir(mraa.DIR_OUT); 
io[1].dir(mraa.DIR_OUT);

// just in case switch off everything
io[0].write(0);
io[1].write(0);