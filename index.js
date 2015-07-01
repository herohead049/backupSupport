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

//*** setup getSaveGroup process

var sgRabbitMQ = _.clone(rabbitMQ, true);
sgRabbitMQ.queue = 'nw.savegroup';
getSaveGroup(sgRabbitMQ);

//---------------------------


var webHits = function () {
    var webHitsName = "webHits",
        webHitsServer = new Hapi.Server({ connections: { routes: { cors: { origin: ['http://backupreport.eu.mt.mtnet'] } } } });
    writeConsole(c.info, webHitsName, " process started");
    webHitsServer.connection({
        port: 8000
    });

    webHitsServer.route({
        method: 'GET',
        path: '/php/{data}',
        handler: function (request, reply) {
            var d = request.params.data,
                site = JSON.parse(d);
            fs.appendFile('newWebAccess.log', moment().format() + "," + site.webSite + "," + site.ip + "," + site.page + "," + site.duration + "," + site.link + "\n", function (err) {
                if (err) { throw err; }
                writeConsole(c.success, webHitsName, site.webSite + " " +  site.ip + " " +  site.page + " " +  site.duration + " " +  site.link);
                    //console.log('The "data to append" was appended to file!');
            });
            reply('Thanks for the information that you uploaded.');
        }
    });
    // Start the server
    webHitsServer.start(function () {
        writeConsole(c.success, webHitsName, "Server running at " + webHitsServer.info.uri);
    });
};


webHits();
