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
            
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<!doctype html><html><head><title>response</title></head><body>');
            res.write('Accepted request to change switch state to '+json.state);
            res.end('</body></html>');
        });
        
    }
    else if(req.method == 'GET') {
        var states = hw.read();
        var turnoffs = getScheduledTurnoffs();
        var jsonString = JSON.stringify({states: states, turnoffs: turnoffs});

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(jsonString);
        
    }
}

} // module.exports

var scheduledTasks = {};

function scheduleAutomaticTurnoff(switchNo, state) {
    var timeout = 15*1000; //15*60*60*1000;
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
