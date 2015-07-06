/*jslint nomen: true */
/*jslint node:true */

"use strict";

var fs = require('fs');
var chalk = require('chalk');
var _ = require('lodash');
var cdlibjs = require('cdlibjs');
var amqp = require('amqplib');
var moment = require('moment');
var Hapi = require('hapi');
var redis = require("redis");


var webServer = new Hapi.Server({ connections: { routes: { cors: { origin: ['http://backupreport.eu.mt.mtnet'] } } } });
webServer.connection({ port: 8000 });




var processDetails = {
    name: "",
    description: ""
};


// chalk object

var c = {
    error: chalk.bold.red,
    success: chalk.bold.green,
    standard: chalk.bold.gray,
    disabled: chalk.underline.gray,
    fileSave: chalk.green,
    info: chalk.inverse.yellow
};
var rabbitMQ = {
    'server': cdlibjs.getRabbitMQAddress(),
    'username': 'test',
    'password': 'test',
    'virtualHost': '/test',
    'queue': 'nw.savegroup'
};

var redisConf = {
    server: cdlibjs.getRedisAddress(),
    port: 6379,
    client: ""
};

function writeFile(file, data) {
    var fs = require('fs');
    fs.writeFile(file, data, function (err) {
        if (err) {
            return console.log(c.error(err));
        }
        //console.log("The file was saved!");
    });
}

function writeConsole(chalk, processName, data) {
    console.log(chalk(moment().format(), processName, data));
}

//******** getSavegroup

var getSaveGroup = function (rabbitMQ) {

    var sgName = "getSavegroup",
        rabbitMQAuthString = 'amqp://' + rabbitMQ.username + ':' + rabbitMQ.password + '@' + rabbitMQ.server + rabbitMQ.virtualHost;
    writeConsole(c.info, sgName, " process started");
    amqp.connect(rabbitMQAuthString).then(function (conn) {
        process.once('SIGINT', function () { conn.close(); });
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertQueue(rabbitMQ.queue, {durable: true});
            ok = ok.then(function (_qok) {
                return ch.consume(rabbitMQ.queue, function (msg) {
                    var saveGroup = JSON.parse(msg.content);
                    writeConsole(c.success, sgName, saveGroup.fileName);
                    writeFile('savedFiles/' + saveGroup.fileName, saveGroup.data);
                    ch.ack(msg);
                }, {noAck: false});
            });
            return ok.then(function (_consumeOk) {
                writeConsole(c.success, sgName, ' [*] Waiting for messages from quename "' + rabbitMQ.queue + '" To exit press CTRL+C');
            });
        });
    }).then(null, console.warn);
};

var processList = {
    started: [],
    getList: function () {
        return this.started;
    },
    addList: function (process) {
        this.started.push(process);
        writeConsole(c.info, "setup", process + " process started");
    }

};

//*** setup getSaveGroup process


//---------------------------



var webHits = function (processDetails) {
    writeConsole(c.info, processDetails.name, " process started");
    webServer.route({
        method: 'GET',
        path: '/php/{data}',
        handler: function (request, reply) {
            var d = request.params.data,
                site = JSON.parse(d);
            fs.appendFile('newWebAccess.log', moment().format() + "," + site.webSite + "," + site.ip + "," + site.page + "," + site.duration + "," + site.link + "\n", function (err) {
                if (err) { throw err; }
                //console.log(moment().format(), site.webSite, site.ip, site.page, site.duration, site.link);
                writeConsole(c.info, processDetails.name, site.webSite + ":" + site.ip + ":" + site.page + ":" + site.duration + ":" + site.link);
                //console.log('The "data to append" was appended to file!');
            });
            reply('Thanks for the information that you uploaded.');
        }
    });
    // Start the server
};

//*** emailLookup

var emailLookup = function (redisConf, processDetails) {
    var emailLookupRedisClient = redis.createClient(redisConf.port, redisConf.server),
        addEmail = function (redisKey, key, val) {
            console.log('Added', val);
            emailLookupRedisClient.hset(redisKey, key, val);
        },
        delEmail = function (redisKey, key) {
            console.log("deleting", key);
            emailLookupRedisClient.hdel(redisKey, key);
        },
        getEmail = function (redisKey, callback) {
            emailLookupRedisClient.hgetall(redisKey, function (err, reply) {
                callback(JSON.stringify(reply));
            });
        };
    writeConsole(c.info, processDetails.name, " process started");
    emailLookupRedisClient.on("error", function (err) {
        console.log("Error " + err);
    });
    writeConsole(c.info, processDetails.name, 'Connected to :' + redisConf.server);

    webServer.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply('Hello, world!');
        }
    });

    webServer.route({
        method: 'GET',
        path: '/get/emails',
        handler: function (request, reply) {
            getEmail("emailKey", function (em) {
                writeConsole(c.standard, processDetails.name, "sending emails  " +  em);
                reply(em);
            });
        }
    });

    webServer.route({
        method: 'GET',
        path: '/put/email/{name}',
        handler: function (request, reply) {
            var j = JSON.parse(request.params.name);
            console.log(request.params.name);
            addEmail("emailKey", j.name, j.email);
            reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        }
    });

    webServer.route({
        method: 'GET',
        path: '/del/email/{name}',
        handler: function (request, reply) {
            var j = JSON.parse(request.params.name);
            console.log(request.params.name);
            delEmail("emailKey", j.name);
            reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
        }
    });
};

var getEmailFromRabbit = function (rabbitMQ, processDetails) {
    writeConsole(c.info, processDetails.name, " process started");
    var rabbitMQAuthString = 'amqp://' + rabbitMQ.username + ':' + rabbitMQ.password + '@' + rabbitMQ.server + rabbitMQ.virtualHost;
    amqp.connect(rabbitMQAuthString).then(function (conn) {
        process.once('SIGINT', function () { conn.close(); });
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertQueue(rabbitMQ.queue, {durable: true});
            ok = ok.then(function (_qok) {
                return ch.consume(rabbitMQ.queue, function (msg) {
                    var emailServer = JSON.parse(msg.content);
                    //console.log(moment().format(), emailServer.to, emailServer.from, emailServer.subject);
                    writeConsole(c.info, processDetails.name, emailServer.to + ":" + emailServer.from + ":" + emailServer.subject);

                    if (emailServer.type === 'html') {
                        cdlibjs.sendEmailHtml(emailServer);
                        ch.ack(msg);
                    }
                }, {noAck: false});
            });
            return ok.then(function (_consumeOk) {
                writeConsole(c.success, processDetails.name, ' [*] Waiting for messages from quename "' + rabbitMQ.queue + '" To exit press CTRL+C');
                //console.log(' [*] Waiting for messages. To exit press CTRL+C');
            });
        });
    }).then(null, console.warn);

};


//** setup process

var emailRabbitProcess = _.clone(processDetails, true);
emailRabbitProcess.name = "Email Rabbit collection";
emailRabbitProcess.description = "This will get the emails from rabbit to sent";
//----------------------------
var webHitsProcess = _.clone(processDetails, true);
webHitsProcess.name = "webHits";
webHitsProcess.description = "Web tracking process";
var emailRabbit = _.clone(rabbitMQ, true);
emailRabbit.queue = 'notifications.email';

//---------------------------

var sgRabbitMQ = _.clone(rabbitMQ, true);
sgRabbitMQ.queue = 'nw.savegroup';

//------------------
var emaillookupProcess = _.clone(processDetails, true);
emaillookupProcess.name = "Email lookup";
emaillookupProcess.description = "retrieve emails from Redis";
var emailLookupRedisConf = _.clone(redisConf);



// start webserver

webServer.start(function () {
    //console.log('info', "Server running at", webServer.info.uri);
    writeConsole(c.info, "General webserver", "Started on " + webServer.info.uri);
});

//---- start processes

webHits(webHitsProcess);
processList.addList("webHitsProcess");
getEmailFromRabbit(emailRabbit, emailRabbitProcess);
processList.addList("emailRabbitProcess");
getSaveGroup(sgRabbitMQ);
processList.addList("sgRabbitMQ");
emailLookup(emailLookupRedisConf, emaillookupProcess);
processList.addList("emaillookupProcess");


console.log(processList.getList());
