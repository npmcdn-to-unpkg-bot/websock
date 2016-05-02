'use strict';

const http = require('http');
const crypto = require('crypto');
const frame = require('./frame');
const SOCK_TOKEN = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const utils = require('./util');

class WebSocket {
  constructor(config) {
    var self = this;
    EventEmitter.call(this);
    config.http
      .on('upgrade', function (req, socket, head) {
        utils.systemMsg('Client handshake request');
        console.log(req.headers);

        var serverHanshake = handshake(req);
        socket.write(serverHanshake);

        utils.systemMsg('Server relies handshake request');
        console.log(serverHanshake);

        self.emit('open', socket);

        socket
          .on('data', function (data) {
            utils.systemMsg('Frame sent from client');
            console.log(utils.hex2bin(data.toString('hex')));

            var aframe = frame.readFrame(data);

            utils.systemMsg('Frame after decoded');
            console.log(aframe);

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
    if (data instanceof Array) {
      for (var i = 0; i < data.length; i++) {
        socket.write(data[i], 'hex');
      };
    } else {
      socket.write(data, 'hex');
    }

    utils.systemMsg('Server sends frame');
    console.log(frame.readFrame(new Buffer(data, 'hex')));
    utils.systemMsg('Frame after encoded');
    console.log(utils.hex2bin(data));

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