/*jslint nomen: true */
/*jslint node:true */

"use strict";

var fs = require('fs');
var chalk = require('chalk');
var moment = require('moment');


var c = {
    error: chalk.bold.red,
    success: chalk.bold.green,
    standard: chalk.bold.gray,
    disabled: chalk.underline.gray,
    fileSave: chalk.green,
    info: chalk.inverse.yellow
};

var writeFile = function (file, data) {
    var fs = require('fs');
    fs.writeFile(file, data, function (err) {
        if (err) {
            return console.log(c.error(err));
        }
        //console.log("The file was saved!");
    });
};


var appendFile = function (file, data) {
    var fs = require('fs');
    fs.appendFile(file, data, function (err) {
        if (err) {
            return console.log(c.error(err));
        }
        //console.log("The file was saved!");
    });
};

var appendFileSync = function (file, data) {
    var fs = require('fs'),
        v = fs.appendFileSync(file, data);
    return v;
};

function writeConsole(chalk, processName, data) {
    console.log(chalk(moment().format(), processName, data));
}


exports.chalk = c;
exports.writeConsole = writeConsole;
exports.writeFile = writeFile;
exports.appendFile = appendFile;
exports.unlink = fs.unlink;
