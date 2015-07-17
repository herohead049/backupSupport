/*jslint nomen: true */
/*jslint node:true */
/*jslint vars: true */
/*jslint es5: true */


"use strict";

var fs = require('fs');
var chalk = require('chalk');
var moment = require('moment');
var winston = require('winston');
var cdlibjs = require('cdlibjs');



var winstonConf = {
    host: cdlibjs.getRedisAddress(),
    port: '6379',
    //auth: 'None',
    length: '200',
    container: 'winston',
    channel: 'None'
};


//winston.add(winston.transports.Redis, winstonConf);
//winston.add(winston.transports.File, { filename: 'somefile.log' });

var trans = [];

function addTransport (transport, conf) {
    trans.push(transport);
}


function startLogger() {
    require('winston-redis').Redis;
    var logger = new (winston.Logger)({
        //transports: trans;
    });

    return logger;
}

function writeLog(level, message) {
    winston.log(level, message);
}


var c = {
    error: chalk.bold.red,
    success: chalk.bold.green,
    standard: chalk.bold.gray,
    disabled: chalk.underline.gray,
    fileSave: chalk.green,
    info: chalk.inverse.yellow
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

function appendFile(file, data) {
    var fs = require('fs');
    fs.appendFile(file, data, function (err) {
        if (err) {
            return console.log(c.error(err));
        }
        //console.log("The file was saved!");
    });
}

function appendFileSync(file, data) {
    var fs = require('fs'),
        v = fs.appendFileSync(file, data);
    return v;
}

function writeConsole(chalk, processName, data) {
    console.log(chalk(moment().format(), processName, data));
}

exports.chalk = c;
exports.writeConsole = writeConsole;
exports.writeFile = writeFile;
exports.appendFile = appendFile;
exports.writeLog = writeLog;
exports.winstonConf = winstonConf;
exports.trans = trans;
exports.addTransport = addTransport;
exports.startLogger = startLogger;
