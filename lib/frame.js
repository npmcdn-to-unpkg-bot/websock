'use strict'

// var buf = ['0x89', '0x05', '0x48', '0x65','0x6c' ,'0x6c', '0x6f']
// var buf = ['0x81', '0x85', '0x37', '0xfa','0x21' ,'0x3d', '0x7f',
//             '0x9f', '0x4d', '0x51', '0x58']
// var buf = ['0x89', '0x05', '0x48', '0x65', '0x6c', '0x6c', '0x6f']
// var buf = ['0x82', '0x7F', '0x0000000000010000']
// var buf = ['0x82', '0x7E', '0x0100']
// var buf = ['0x01', '0x03', '0x48', '0x65', '0x6c'];
// var buf = ['0x80', '0x02', '0x6c', '0x6f'];

// console.log(readFrame(new Buffer(buf)));

const PAYLOAD_SIZE = 2;

function readFrame (data) {
  var pointer = 0;
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


  if (frame.payloadLen === 126) {
    frame.payloadLen = data.slice(pointerHex, pointerHex+=2);
    frame.payloadLen = parseInt(frame.payloadLen.toString('hex'), 16);
  } else if (frame.payloadLen === 127) {
    frame.payloadLen = data.slice(pointerHex, pointerHex+=8);
    frame.payloadLen = parseInt(frame.payloadLen.toString('hex'), 16);
  };

  if (frame.mask) {
    frame.maskKey= data.slice(pointerHex,pointerHex += 4);
    var index = 0;
    while (pointerHex < data.length) {
      frame.data += String.fromCharCode(data[pointerHex++] ^ frame.maskKey[index++ % 4]);
    }
  } else {
    frame.data = data.toString().substring(pointerHex, data.length);
  }

  frame.opcodeWord = interceptOpcode((frame.opcode).toString(16));
  return frame
}

function makeString (num) {
  var string = '';
  for (var i = 0; i < num; i++) {
    string += 'a';
  };
  return string;
}

// var string = makeString(5);
// var buf = send('abcdefg')

// if (buf instanceof Array) {
//   for (var i = 0; i < buf.length; i++) {
//     console.log(readFrame(new Buffer(buf[i], 'hex')));
//   };
// } else {
//   console.log(readFrame(new Buffer(buf, 'hex')));
// }

function send (data, options) {
  options = options || {}
  var fragmentNum = Math.ceil(data.length / PAYLOAD_SIZE);
  var frames = [];
  var tmp;

  if (fragmentNum === 1) {
    return makeFrame(initFrame(data, options));
  } else {
    // First frame
    options.fin = 0;
    tmp = data.substring(0, 2);
    frames.push(makeFrame(initFrame(tmp, options)));

    // Middle frames
    options.opcode = 0;
    for (var i = 1; i < fragmentNum - 1; i++) {
      tmp = data.substring(2*(i+1), 2);
      frames.push(makeFrame(initFrame(tmp, options)));
    }

    // Last frame
    options.fin = 1;
    tmp = data.substring(2*(fragmentNum-1), data.length);
    frames.push(makeFrame(initFrame(tmp, options)));

    return frames;
  }
}

/**
 * Initial fram values
 */
function initFrame(data, options) {
  return {
    fin: options.fin === undefined ? 1 : options.fin,
    rsv1: options.rsv1 || 0,
    rsv2: options.rsv2 || 0,
    rsv3: options.rsv3 || 0,
    opcode: options.opcode === undefined ? 1 : options.opcode,
    mask: 0,
    payloadLen: data.length,
    data: data
  }
}

/**
 * Construct a frame into hex string
 */
function makeFrame (data) {
  var dataString = '';
  var aByte = data.fin * twoPower(7) + data.rsv1*twoPower(6) + data.rsv2*twoPower(5) + data.rsv3*twoPower(4) + data.opcode;
  
  dataString += dec2bin(aByte, 8);
  aByte = data.mask * twoPower(7);

  if (data.payloadLen <= 125) {
    dataString += dec2bin(aByte + data.payloadLen, 8);
  } else if (data.payloadLen < twoPower(8*2)) {
    dataString += dec2bin(aByte + 126, 8);
    dataString += dec2bin(data.payloadLen, 8 * 2 );
  } else if (data.payloadLen < twoPower(8*8)) {
    dataString += dec2bin(aByte + 127, 8);
    dataString += dec2bin(data.payloadLen, 8 * 8 );
  }

  dataString = bin2hex(dataString);
  dataString += Buffer(data.data).toString('hex');
  return dataString;
}


function bin2hex(bin) {
  var output = '';
  for (var i=0; i < bin.length; i+=4) {
    var bytes = bin.substr(i, 4);
    output+= parseInt(bytes, 2).toString(16);
  }
  return output;      
}

function twoPower(num) {
  return Math.pow(2,num);
}

function dec2binsub (num) {
  return parseInt(num, 10).toString(2);
}

function dec2bin (num, size) {
  var s = dec2binsub(num);
  while (s.length < size) s = '0' + s;
  return s;
}

function dec2hex (num) {
  return parseInt(num, 10).toString(16);
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

// function decodeWebSocket (data){
//   console.log('data', data);
//   console.log(data.toString('utf8').length);
//   var datalength = data[1] & 127;
//   console.log('datalength', datalength);
//   console.log('datalength', data[1]);
//   var indexFirstMask = 2;
//   if (datalength == 126) {
//     indexFirstMask = 4;
//   } else if (datalength == 127) {
//     indexFirstMask = 10;
//   }
//   var masks = data.slice(indexFirstMask,indexFirstMask + 4);
//   console.log('masks', masks);
//   var i = indexFirstMask + 4;
//   var index = 0;
//   var output = "";
//   while (i < data.length) {
//     output += String.fromCharCode(data[i++] ^ masks[index++ % 4]);
//   }
//   return output;
// }

exports.readFrame = readFrame;
exports.send = send;