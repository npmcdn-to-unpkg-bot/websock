'use strict';

var http = require('http');
var WebSocket = require('../lib/websocket');
const chalk = require('chalk')

var socketPool = {};

var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});
server.listen(3000, function() {
  console.log((new Date()) + ' Server is listening on port 3000');
});

var ws = new WebSocket({http: server});

ws
  .on('open', function (socket) {
    // var id = socket.remoteAddress +':'+ socket.remotePort;
    // socket.WebSocketId = id;
    // socketPool[id] = {socket};
  })
  .on('text', function (msg, socket) {
    msg = JSON.parse(msg);
    switch(msg.type) {
      case 'register':
        socketPool[msg.id] = {socket};
        notify(socket, makeMessage({
          id: msg.id, 
          type: 'register',
        }));
        notifyAll(makeMessage({
          id: msg.id, 
          type: 'system',
          text: msg.id + ' has joined' 
        }));
        console.log(Object.keys(socketPool));
        notifyAll(makeMessage({
          type: 'userlist',
          id: msg.id,
          data: Object.keys(socketPool)
        }));
        break;
      case "message":
        notifyAll(makeMessage({
          id: msg.id,
          text: msg.text
        }));
        break;
      case 'userlist':
        notifyAll(makeMessage({
          type: 'userlist',
          id: msg.id,
          data: Object.keys(socketPool)
        }));
        break;
    }
  })
  .on('close', function (socket) {
    var index;
    for (var key in socketPool) {
      if (socketPool[key] === socket) {
        index  = key;
      };
    };
    notifyAll(makeMessage({
      id: index, 
      type: 'system',
      text: index+ ' has left' 
    }));
  })

function register (argument) {
  // body...
}

function makeMessage (options) {
  var sendingMsg = {
    type: options.type || 'message',
    text: options.text,
    id: options.id,
    date: Date.now(),
    data: options.data
  };

  return JSON.stringify(sendingMsg);
}

function notifyAll (msg) {
  notifyAllBut(msg);
}

function notifyAllBut (msg, people) {
  people = people || [];
  for (var id in socketPool) {
    if (people.indexOf(id) === -1) {
      notify(socketPool[id].socket, msg);
    }
  }
}

function notify(socket, msg) {
  ws.sendFrame(socket, msg);
}