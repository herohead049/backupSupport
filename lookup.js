var redis = require("redis"),
    cdlib = require('cdlib'),
    _ = require('lodash'),
    Hapi = require('hapi');


var redisConf = {
    server: cdlib.getRedisAddress(),
    //server: "localhost",
    port: 6379
};

var emailList = [
    {name: "craig David", email: 'craig.david@mt.com'},
    {name: "Craig Gmail", email: 'herohead@gmail.com'},
    {name: "Craig Gmail", email: 'herohead@gmail.com'}
];


function addEmail(redisKey,key,val) {
    console.log('Added', val);
    client.hset(redisKey, key, val);
}

function delEmail(redisKey,key) {
    console.log("deleting", key);
    client.hdel(redisKey, key);
}

function getEmail(redisKey,callback) {
    client.hgetall(redisKey, function (err, reply) {
        //return JSON.stringify(reply);
        //return reply.toString();
        callback(JSON.stringify(reply));
    });

};

client = redis.createClient(redisConf.port,redisConf.server);

client.on("error", function (err) {
        console.log("Error " + err);
});

console.log('Connected to :', redisConf.server);
/**
_.forEach(emailList, function (val, key) {
        //console.log(val.email);
    addEmail("emailKey", val.name, val.email);
});
**/
//delEmail('emailKey','Craig Gmail');


getEmail("emailKey", function (em) {
    console.log(em);
});

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.route({
    method: 'GET',
    path: '/get/emails',
    handler: function (request, reply) {
          getEmail("emailKey", function (em) {
          console.log("sending emails",em);
      reply(em);
    });
}
})

server.route({
    method: 'GET',
    path: '/put/email/{name}',
    handler: function (request, reply) {
        var j = JSON.parse(request.params.name);
        console.log(request.params.name);
        addEmail("emailKey", j.name, j.email);
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

server.route({
    method: 'GET',
    path: '/del/email/{name}',
    handler: function (request, reply) {
        var j = JSON.parse(request.params.name);
        console.log(request.params.name);
        delEmail("emailKey", j.name);
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});


server.start(function () {
    console.log('Server running at:', server.info.uri);
});



var prequest = require('prequest');

prequest('http://localhost:3000/get/emails').then(function (body) {
  //console.log(body);
    return body;
}).then(function (body) {
    _.forEach(body, function (val, key) {
        console.log(val);
    //addEmail("emailKey", val.name, val.email);
    });
}).catch(function (err) { // Any HTTP status >= 400 falls here
  console.error('Failed.', err.statusCode, ' >= 400');
});




