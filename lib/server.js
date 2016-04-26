const http = require('http');
const crypto = require('crypto');
const frame = require('./frame');
const SOCK_TOKEN = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const PORT = 3000;
const IP = '127.0.0.1';

// Create an HTTP server
var server = http.createServer( (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
});

// now that server is running
server
  .listen(PORT, IP, () => {
    console.log('Server running at ' + IP + ':' + PORT)
  })
  .on('upgrade', (req, socket, head) => {
    headers = handshake(req);
    socket.write(headers);

    socket
      .on('data', function (data) {
        var aframe = frame.readFrame(data);
        console.log(aframe.data.length);
        if (aframe.data.length > 1000) {
          console.log(aframe.data.substring(0,10));
          aframe.data = ''
        };
        console.log('return', aframe)

        switch(aframe.opcode){
          case 'close':
            socket.destroy();
        }

        send(socket, 'what');
      })
      .on('close', function (sc) {
        console.log(sc);
        console.log('close')
      })
  });


function handshake (req) {
  var headers = 'HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
  'Upgrade: WebSocket\r\n' +
  'Connection: Upgrade\r\n' 
  + 'Sec-WebSocket-Accept: {{token}}\r\n'
  + '\r\n'
  return headers.replace('{{token}}', encrypt(req.headers['sec-websocket-key']))
}

function encrypt (clientToken) {
  clientToken += SOCK_TOKEN;
  var hash = crypto.createHash('sha1');
  return hash.update(clientToken).digest('base64');
}

function send(socket, msg) {
  // var data = frame.send('hel');
  // if (data instanceof Array) {
  //   for (var i = 0; i < data.length; i++) {
  //     socket.write(data[i], 'hex');
  //   };
  // };
}

function testFragments (socket) {
  var data = frame.send('hel', {fin:0});
  var buf = new Buffer(data, 'hex');
  console.log('data', frame.readFrame(buf))
  socket.write(data, 'hex');
  data = frame.send('lo ', {fin:0, opcode: 0});

  buf = new Buffer(data, 'hex');
  console.log('data1', frame.readFrame(buf))
  socket.write(data, 'hex');

  data = frame.send('their', {fin:1, opcode: 0});
  buf = new Buffer(data, 'hex');
  console.log('data2', frame.readFrame(buf))
  socket.write(data, 'hex');
}