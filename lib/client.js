'use strict';

var http = require('http');

// http.get({
//   hostname: 'localhost',
//   port: 3000,
//   path: '/',
//   Upgrade: 'websocket',
//   'Connection': 'Upgrade',
//   'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
//   'Sec-WebSocket-Version': 13
// }, (req, res) => {
  
// }).on('socket', (socket) => {
//   console.log(socket)
// });

var options = {
    port: 3000,
    hostname: '127.0.0.1',
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket'
    }
  };

  var req = http.request(options);
  req.end();

  req.on('upgrade', (res, socket, upgradeHead) => {
    console.log('got upgraded!');
    socket.end();
    process.exit(0);
  });