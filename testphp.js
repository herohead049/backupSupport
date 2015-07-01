/*jslint nomen: true */
/*jslint node:true */

var Hapi = require('hapi');
var moment = require('moment');
var fs = require('fs');


//var server = new Hapi.Server();
var server = new Hapi.Server({ connections: { routes: { cors: { origin: ['http://backupreport.eu.mt.mtnet'] } } } });

server.connection({
    port: 8000
});

server.route({
    method: 'GET',
    path: '/php/{data}',
    handler: function (request, reply) {
        "use strict";
        var d = request.params.data;
        var site = JSON.parse(d);
        //ddSpace = j;

        fs.appendFile('newWebAccess.log', moment().format() + "," + site.webSite + "," + site.ip + "," + site.page + "," + site.duration + "," + site.link + "\n", function (err) {
            if (err) throw err;
            console.log(moment().format(),site.webSite, site.ip,site.page,site.duration,site.link);
                //console.log('The "data to append" was appended to file!');
        });
        reply('Thanks for the information that you uploaded.');
    }
});





// Start the server
server.start(function () {
    "use strict";
    console.log('info', "Server running at", server.info.uri);
});


