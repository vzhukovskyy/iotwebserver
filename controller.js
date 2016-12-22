var hw = require('./hardware');

module.exports = {
    
handleApiCall: function(req, res) {
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
            scheduleAutomaticTurnoff(json.switch, json.state);

            jsonString = composeStateJson();
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
    var timeout = 15*60*60*1000;
    if(state) {
        var timeoutId = setTimeout(function(){
            delete scheduledTasks[switchNo];
            hw.write(switchNo, 0);            
            console.log('Automatically turned off switch ', switchNo);
        }, timeout);
        
        var task = {
            at: new Date(Date.now()+timeout),
            id: timeoutId
        };
        scheduledTasks[switchNo] = task;
        
        console.log('Scheduled automatic turnoff at',task.at);
        console.log(scheduledTasks);
    }
    else {
        var task = scheduledTasks[switchNo];
        delete scheduledTasks[switchNo];
        clearTimeout(task.id);
        
        console.log('Cancelled automatic turnoff at',task.at);
        console.log(scheduledTasks);
    }
}

function getScheduledTurnoffs() {
    var sched = [];
    sched.push(scheduledTasks[0] && scheduledTasks[0].at);
    sched.push(scheduledTasks[1] && scheduledTasks[1].at);
    return sched;
}
