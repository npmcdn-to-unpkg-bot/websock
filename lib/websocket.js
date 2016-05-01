'use strict';

const http = require('http');
const crypto = require('crypto');
const frame = require('./frame');
const SOCK_TOKEN = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const EventEmitter = require('events').EventEmitter;
const util = require('util');

class WebSocket {
  constructor(config) {
    var self = this;
    EventEmitter.call(this);
    config.http
      .on('upgrade', function(req, socket, head){
        socket.write(handshake(req));
        self.emit('open', socket);

        socket
          .on('data', function (data) {
            var aframe = frame.readFrame(data);
            self.requestHandler(socket, aframe);
          })
          .on('close', function () {
            self.emit('close', socket);
          })
      })
  }

  requestHandler (socket, aframe) {
    switch (aframe.opcode) {
      case 0:
        break;
      case 1:
      case 2:
        this.emit(aframe.opcodeWord, aframe.data, socket);
        break;
      case 8:
        // Send close frame to client and close connection
        socket.write(frame.closeFrame(aframe), 'hex');
        // var view = frame.readFrame(new Buffer(frame.closeFrame(aframe), 'hex'));
        socket.destroy();
        break;
      case 9:
        // Response to ping request by pong
        socket.write(frame.pongFrame(aframe), 'hex');
        break;
    }
  }

  sendFrame(socket, msg) {
    if (typeof msg !== 'string') {
      throw Error('Message must be a string');
    };
    var data = frame.send(msg);
    console.log('here');
    if (data instanceof Array) {
      for (var i = 0; i < data.length; i++) {
        socket.write(data[i], 'hex');
      };
    } else {
      socket.write(data, 'hex');
    }
  }
}

util.inherits(WebSocket, EventEmitter);

module.exports = WebSocket;

function handshake (req) {
  var headers = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
  'Upgrade: WebSocket\r\n' +
  'Connection: Upgrade\r\n' 
  + 'Sec-WebSocket-Accept: {{token}}\r\n'
  // + "Sec-WebSocket-Extensions: permessage-deflate\r\n"
  + '\r\n';
  return headers
          .replace('{{token}}', encrypt(req.headers['sec-websocket-key']))
}

function encrypt (clientToken) {
  clientToken += SOCK_TOKEN;
  return crypto
          .createHash('sha1')
          .update(clientToken)
          .digest('base64');
}

module.exports = WebSocket;