'use strict'

const status = require('./status');
const PAYLOAD_SIZE = 47000;
const utils = require('./util');

function readFrame (data) {
  var pointerHex = 2;
  var frame = {
    fin: data[0] >> 7 & 1,
    rsv1: data[0] >> 6 & 1,
    rsv2: data[0] >> 5 & 1,
    rsv3: data[0] >> 4 & 1,
    opcode: data[0] & 15,
    mask: data[1] >> 7 & 1,
    payloadLen: (data[1] & 127),
    data: ''
  }

  // If the payloadLen is less than 126, it is actual value
  // If the payloadLen is 126, the actual payloadLen is the next 2 bytes
  // If the payloadLen is 127, the actual payloadLen is the next 8 bytes
  if (frame.payloadLen === 126) {
    frame.payloadLen = data.slice(pointerHex, pointerHex+=2);
    frame.payloadLen = parseInt(frame.payloadLen.toString('hex'), 16);
  } else if (frame.payloadLen === 127) {
    frame.payloadLen = data.slice(pointerHex, pointerHex+=8);
    frame.payloadLen = parseInt(frame.payloadLen.toString('hex'), 16);
  };

  if (frame.mask) {
    // Get the mask key
    frame.maskKey= data.slice(pointerHex,pointerHex += 4);

    // Unmask the message
    var index = 0;
    while (pointerHex < data.length) {
      frame.data += String.fromCharCode(data[pointerHex++] ^ frame.maskKey[index++ % 4]);
    }

    // If the fame is a close frame, the first 2 bytes are the status code
    // and the rest is the reason for closing
    if (frame.opcode === 8 && frame.data) {
      frame.status = new Buffer(frame.data.substr(0,2)).readUInt16BE();
      frame.data = frame.data.replace(frame.data.substr(0,2),'');
    }

  } else {
    frame.data = data.toString().substr(pointerHex, frame.payloadLen);
  }

  frame.opcodeWord = interceptOpcode((frame.opcode).toString(16));
  return frame;
}

function send (data, options) {
  var fragmentNum = Math.ceil(data.length / PAYLOAD_SIZE);
  if (fragmentNum === 1) {
    return makeFrame(data, options);
  } else {
    options = options || {};
    var frames = [];
    var tmp;

    // First frame
    options.fin = 0;
    tmp = data.substring(0, 2);
    frames.push(makeFrame(tmp, options));

    // Middle frames
    options.opcode = 0;
    for (var i = 1; i < fragmentNum - 1; i++) {
      tmp = data.substring(2*i,2*i + 2);
      frames.push(makeFrame(tmp, options));
    }

    // Last frame
    options.fin = 1;
    tmp = data.substring(2*(fragmentNum-1), data.length);
    frames.push(makeFrame(tmp, options));

    return frames;
  }
}

/**
 * Initial frame values
 */
function initFrame(data, options) {
  options = options || {};
  data = data || '';
  return {
    fin: options.fin === undefined ? 1 : options.fin,
    rsv1: options.rsv1 || 0,
    rsv2: options.rsv2 || 0,
    rsv3: options.rsv3 || 0,
    opcode: options.opcode === undefined ? 1 : options.opcode,
    mask: 0,
    payloadLen: options.payloadLen || data.length,
    data: data,
    status: options.status
  }
}

/**
 * Construct a frame into hex string
 */
function makeFrame (msg, options) {
  const data = initFrame(msg, options);
  var dataString = '';
  var aByte = data.fin * utils.twoPower(7) + data.rsv1*utils.twoPower(6) + data.rsv2*utils.twoPower(5) + data.rsv3*utils.twoPower(4) + data.opcode;

  dataString += utils.dec2bin(aByte, 8);
  aByte = data.mask * utils.twoPower(7);

  if (data.payloadLen <= 125) {
    dataString += utils.dec2bin(aByte + data.payloadLen, 8);
  } else if (data.payloadLen < utils.twoPower(8*2)) {
    dataString += utils.dec2bin(aByte + 126, 8);
    dataString += utils.dec2bin(data.payloadLen, 8 * 2 );
  } else if (data.payloadLen < utils.twoPower(8*8)) {
    dataString += utils.dec2bin(aByte + 127, 8);
    dataString += utils.dec2bin(data.payloadLen, 8 * 8 );
  }

  dataString = utils.bin2hex(dataString);

  if (data.opcode === 8) {
    var statusCode = 1005;
    if (data.status) {
      statusCode = data.status;
    };

    var status = new Buffer(2);
    status.writeUInt16BE(statusCode, 0, true);
    dataString += status.toString('hex');
  };

  dataString += Buffer(data.data).toString('hex');
  return dataString;
}

/**
 * 
 */
function interceptOpcode (code) {
  switch(code){
    case '0':
      return 'continuation';
      break;
    case '1':
      return 'text';
      break;
    case '2':
      return 'binary';
      break;
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
      return 'reserved non-control';
      break;
    case '8':
      return 'close';
      break;
    case '9':
      return 'ping';
      break;
    case 'a':
      return 'pong';
      break;
    case 'b':
    case 'c':
    case 'd':
    case 'e':
    case 'f':
      return 'reserved control';
  }
}

function pongFrame (pingFrame) {
  pingFrame.opcode = 10;
  return makeFrame(pingFrame.data, pingFrame);
}

function closeFrame (close) {
  return makeFrame(close.data, close);
}

exports.readFrame = readFrame;
exports.makeFrame = makeFrame;
exports.send = send;
exports.pongFrame = pongFrame;
exports.closeFrame = closeFrame;