/*jslint nomen: true */
/*jslint node:true */

"use strict";

var chalk = require('chalk');
var _ = require('lodash');
var cdlibjs = require('cdlibjs');
var amqp = require('amqplib');
var moment = require('moment');

function writeConsole(chalk, processName, data) {
    console.log(chalk(moment().format(), processName, data));
}

var processDetails = {
    name: "",
    description: "",
    messageType: ""
};

var c = {
    error: chalk.bold.red,
    success: chalk.bold.green,
    standard: chalk.bold.gray,
    disabled: chalk.underline.gray,
    fileSave: chalk.green,
    info: chalk.inverse.yellow
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

var rabbitMQ = {
    server: cdlibjs.getRabbitMQAddress(),
    username: 'test',
    password: 'test',
    virtualHost: '/test',
    queue: 'nw.savegroup'
};

var pullSaveGroupResults = function (rabbitMQ, processDetails) {
    writeConsole(c.info, processDetails.name, " process started");
    var rabbitMQAuthString = 'amqp://' + rabbitMQ.username + ':' + rabbitMQ.password + '@' + rabbitMQ.server + rabbitMQ.virtualHost;
    amqp.connect(rabbitMQAuthString).then(function (conn) {
        process.once('SIGINT', function () {
            conn.close();
        });
        return conn.createChannel().then(function (ch) {
            var ok = ch.assertQueue(rabbitMQ.queue, {durable: true});
            ok = ok.then(function (_qok) {
                return ch.consume(rabbitMQ.queue, function (msg) {
                    var saveGroup = JSON.parse(msg.content);
                    writeConsole(processDetails.messageType, processDetails.name, saveGroup.timeStamp + ":" + saveGroup.server + ":" + saveGroup.group);
                    ch.ack(msg);

                }, {noAck: false});
            });
            return ok.then(function (_consumeOk) {
                writeConsole(c.info, processDetails.name, ' [*] Waiting for messages from quename "' + rabbitMQ.queue + '" To exit press CTRL+C');
            });
        });
    }).then(null, console.warn);
};

var sgFailedProcess = _.clone(processDetails, true);
var failedRabbitMQ = _.clone(rabbitMQ, true);
failedRabbitMQ.queue = 'nw.savegroup.failed';
sgFailedProcess.name = "failed savegroups";
sgFailedProcess.messageType = c.error;
sgFailedProcess.description = "save group failed";

var sgFailed = _.clone(pullSaveGroupResults(failedRabbitMQ, sgFailedProcess), true);

var sgDisabledProcess = _.clone(processDetails, true);
var disabledRabbitMQ = _.clone(rabbitMQ, true);
disabledRabbitMQ.queue = 'nw.savegroup.disabled';
sgDisabledProcess.messageType = c.disabled;
sgDisabledProcess.name = "disabled savegroups";
sgDisabledProcess.description = "save group disabled";

var sgDisabled = _.clone(pullSaveGroupResults(disabledRabbitMQ, sgDisabledProcess), true);

var sgSuccessProcess = _.clone(processDetails, true);
var successRabbitMQ = _.clone(rabbitMQ, true);
successRabbitMQ.queue = 'nw.savegroup.success';
sgSuccessProcess.name = "success savegroups";
sgSuccessProcess.messageType = c.success;
sgSuccessProcess.description = "save group success";

var sgSuccess = _.clone(pullSaveGroupResults(successRabbitMQ, sgSuccessProcess), true);

sgFailed;
sgDisabled;
sgSuccess;
