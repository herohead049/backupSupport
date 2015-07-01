var amqp = require('amqplib');
var fs = require("fs");
var cdlib = require('cdlib');
var serialize = require('node-serialize');
var Promise =  require('bluebird');
var colors = require('colors');
var moment = require('moment');

var rabbitMQ = {
    'server': cdlib.getRabbitMQAddress(),
    'username': 'test',
    'password': 'test',
    'virtualHost': '/test',
    'queue': 'notifications.email'
};

var rabbitMQAuthString = 'amqp://' + rabbitMQ.username + ':' + rabbitMQ.password + '@' + rabbitMQ.server + rabbitMQ.virtualHost;

amqp.connect(rabbitMQAuthString).then(function (conn) {
    process.once('SIGINT', function () { conn.close(); });
    return conn.createChannel().then(function (ch) {

        var ok = ch.assertQueue(rabbitMQ.queue, {durable: true});

        ok = ok.then(function (_qok) {
            return ch.consume(rabbitMQ.queue, function(msg) {
                var emailServer = JSON.parse(msg.content);
                console.log(moment().format(), emailServer.to, emailServer.from, emailServer.subject);

                if (emailServer.type === 'html') {
                    cdlib.sendEmailHtml(emailServer);
                            ch.ack(msg);
                }
            }, {noAck: false});
        });

        return ok.then(function (_consumeOk) {
            console.log(' [*] Waiting for messages. To exit press CTRL+C'.green);
        });
    });
}).then(null, console.warn);
