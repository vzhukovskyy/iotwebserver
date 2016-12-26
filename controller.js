var hw = require('./hardware');
var logger = require('./logger');

module.exports = {
    
handleApiCall: function(req, res) {
    var apiUrl = req.url.substr(5);
    //console.log('handling API call',apiUrl);
    
    if(req.method == 'POST') {
        var jsonString = '';

        req.on('data', function (data) {
            jsonString += data;
        });

        req.on('end', function () {
            var json = JSON.parse(jsonString);
            //console.log(json);
            
            if(req.url === '/api/setSwitchState') {
                hw.write(json.switch, json.state);
                scheduleAutomaticTurnoff(json.switch, json.state);
                logger.log('turned '+(json.state?'on':'off')+' switch '+hw.getSwitchName(json.switch), req);

                jsonString = composeStateJson();
            }
            else if(req.url === '/api/newGeoLocation') {
                jsonString = '{}';
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(jsonString);
         });
        
    }
    else if(req.method == 'GET') {
        var jsonString = composeStateJson();
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(jsonString);
        
    }
}

}; // module.exports

function composeStateJson() {
    var states = hw.read();
    var turnoffs = getScheduledTurnoffs();
    var jsonString = JSON.stringify({states: states, turnoffs: turnoffs});
    return jsonString;
}

var scheduledTasks = {};

function scheduleAutomaticTurnoff(switchNo, state) {
    //var timeout = 15*1000;
    var timeout = 10*60*1000;
    if(state) {
        var timeoutId = setTimeout(function(){
            delete scheduledTasks[switchNo];
            hw.write(switchNo, 0);            
            logger.log('automatically turned off switch '+hw.getSwitchName(switchNo));
        }, timeout);
        
        var task = {
            at: new Date(Date.now()+timeout),
            id: timeoutId
        };
        scheduledTasks[switchNo] = task;
        
        //console.log('Scheduled automatic turnoff at',task.at);
        //console.log(scheduledTasks);
    }
    else {
        var task = scheduledTasks[switchNo];
        if(task) {
            delete scheduledTasks[switchNo];
            clearTimeout(task.id);
        }
        
        //console.log('Cancelled automatic turnoff at',task.at);
        //console.log(scheduledTasks);
    }
}

function getScheduledTurnoffs() {
    var sched = [];
    var now = Date.now();
    sched.push(scheduledTasks[0] && Math.ceil((scheduledTasks[0].at.getTime()-now)/1000));
    sched.push(scheduledTasks[1] && Math.ceil((scheduledTasks[1].at.getTime()-now)/1000));
    return sched;
}
