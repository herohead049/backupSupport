/*jslint nomen: true */
/*jslint node:true */
/*jslint vars: true */
/*jslint es5: true */


var util = require('../backupSupport/lib/cdutils.js');
var _ = require('lodash');

util.winstonConf.channel = null;

util.addTransport(new(winston.transports.Redis, _.clone(util.winstonConf)));
//util.addTransport("new(winston.transports.Redis, _.clone(util.winstonConf))");
//winston.add(winston.transports.Redis, options);
var log = util.startLogger();

console.log(util.trans);
//('log1', util.winstonConf);
//var log1 = new util.setupLog(util.winstonConf);
//console.log(util.winstonConf);

//util.winstonConf.channel = 'None';
//util.winstonConf.container = 'winston-2';

//var opt = _.clone(util.winstonConf);

//var log2 = new util.setupLog('log2', opt);


log.log('info', 'Here is the messages');
//log2.log('info', 'Here is the message - cooooll');

//console.log(log1);

//util.writeLog('info', "Here is the message");
