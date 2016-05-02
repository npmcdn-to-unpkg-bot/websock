'use strict';

const assert = require('assert');
const http = require('http');
const wesockFrame = require('../lib/frame');
// var server = require('../lib/server');

const msg = 'Hello world';
const options = {
  port: 3000,
  hostname: '127.0.0.1',
  headers: {
    'Connection': 'Upgrade',
    'Upgrade': 'websocket',
    'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
  }
};

describe('test frame', function(){
  describe('test read frame', function(){
    it('test read unmasked frame', function() {
      const buf = ['0x89', '0x05', '0x48', '0x65','0x6c' ,'0x6c', '0x6f'];
      const bufFrame = wesockFrame.readFrame(new Buffer(buf));
      const value = { fin: 1,
        rsv1: 0,
        rsv2: 0,
        rsv3: 0,
        opcode: 9,
        mask: 0,
        payloadLen: 5,
        data: 'Hello',
        opcodeWord: 'ping' }
      assert.deepEqual(value, bufFrame);
    })

    it('test read masked frame', function() {
      const buf = ['0x81', '0x85', '0x37', '0xfa','0x21' ,'0x3d', '0x7f',
                  '0x9f', '0x4d', '0x51', '0x58']
      const bufFrame = wesockFrame.readFrame(new Buffer(buf));
      const value = { fin: 1,
        rsv1: 0,
        rsv2: 0,
        rsv3: 0,
        opcode: 1,
        mask: 1,
        payloadLen: 5,
        data: 'Hello',
        opcodeWord: 'text',
        maskKey: new Buffer(buf.splice(2,4))}
        assert.deepEqual(value, bufFrame);
    })
  })

  describe('test make frame', function(){
    it('test make text frame', function() {
      var frame = wesockFrame.makeFrame(msg);
      frame = wesockFrame.readFrame(new Buffer(frame, 'hex'));
      assert.equal(frame.data, msg);
    })
  })
})

describe('test', function(){
  it('test update request', function(done) {
    var req = http.request(options);
    req.end();

    req.on('upgrade', (res, socket, upgradeHead) => {
      assert.ok(res.headers['sec-websocket-accept']);
      socket.end();
      done();
    })
  });

  it('test websocket key', function(done) {
    var req = http.request(options);
    req.end();

    req.on('upgrade', (res, socket, upgradeHead) => {
      assert.equal(res.headers['sec-websocket-accept'], 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
      socket.end();
      done();
    });
  });

  it('test ping', function(done) {
    var req = http.request(options);
    req.end();
    req
      .on('upgrade', (res, socket, upgradeHead) => {
        var frame = wesockFrame.makeFrame(msg, {opcode: 9});
        socket.write(frame, 'hex');
        socket
          .on('data', function (data) {
            const resFrame = wesockFrame.readFrame(data);
            assert.equal(resFrame.opcode, 10);
            assert.equal(resFrame.data, msg);
            socket.end();
            done();
          }) 
      })
  });

  it('test close', function(done) {
    var req = http.request(options);
    req.end();
    req
      .on('upgrade', (res, socket, upgradeHead) => {
        var frame = wesockFrame.makeFrame(msg, {opcode: 8});
        socket.write(frame, 'hex');
        socket
          .on('data', function (data) {
            const resFrame = wesockFrame.readFrame(data);
            assert.equal(resFrame.opcode, 8);
            // assert.equal(resFrame.data, msg);
            socket.end();
            done();
          }) 
      })
  });
});