# websock

<!-- [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url] -->


This library runs on nodejs engine, if you don't have it installed, please visit [node.js](https://nodejs.org/).

## Usage

```js
'use strict';

var http = require('http');
var WebSocket = require('../lib/websocket');

// Create your own server
var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});

server.listen(80, function() {
  console.log((new Date()) + ' Server is listening on port 80');
});

// Attached the server to websocket
var ws = new WebSocket({http: server});

ws
  .on('open', function (socket) {
    // This is called after connection has been established
  })
  .on('text', function (msg, socket) {
    // Handle text message here
  })
  .on('binary', function (msg, socket) {
    // Handle binary message here
  })
  .on('close', function (socket) {
    // Handle closing connection here
  })
```

## Run demo

Go to the library page. And run command `npm install` to install all dependencies and and then run `npm install -g gulp` to install Gulp task runner. 

Modify `HOST` at line 3 example/app.js to your localhost (DO NOT USE PORT 3000, it is for the website), example 

```js
  const HOST = 'ws://localhost:9000';
```

Run `gulp serve` to start serve, and open another terminal and run `gulp web` to start the web.

## Getting To Know Yeoman

Yeoman has a heart of gold. He&#39;s a person with feelings and opinions, but he&#39;s very easy to work with. If you think he&#39;s too opinionated, he can be easily convinced. Feel free to [learn more about him](http://yeoman.io/).

## Created with
[Yeoman](https://npmjs.org/package/yo) and [Generator-simple-package](https://npmjs.org/package/generator-simple-package)

## License
MIT © [NghiaTTran]()

[npm-image]: https://badge.fury.io/js/websock.svg
[npm-url]: https://npmjs.org/package/websock
[travis-image]: https://travis-ci.org/nghiattran/websock.svg?branch=master
[travis-url]: https://travis-ci.org/nghiattran/websock
[daviddm-image]: https://david-dm.org/nghiattran/websock.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/nghiattran/websock
[coveralls-image]: https://coveralls.io/repos/nghiattran/websock/badge.svg
[coveralls-url]: https://coveralls.io/github/nghiattran/websock
