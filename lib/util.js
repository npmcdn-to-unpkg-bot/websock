'use strict'
const chalk = require('chalk')

var utils = exports
/**
 * Wrapper for system message
 */
utils.systemMsg = function (msg) {
  console.log(chalk.red.bold('System: ') + msg)
}

utils.bin2hex = function (bin) {
  var output = '';
  for (var i=0; i < bin.length; i+=4) {
    var bytes = bin.substr(i, 4);
    output+= parseInt(bytes, 2).toString(16);
  }
  return output;      
}

utils.twoPower = function (num) {
  return Math.pow(2,num);
}

utils.dec2bin = function (num, size) {
  var s = parseInt(num, 10).toString(2);
  while (s.length < size) s = '0' + s;
  return s;
}

utils.hex2bin = function (hex) {
  var bin = '';
  for(var i=0; i< hex.length-1; i+=2){
    bin += parseInt(hex.substr(i, 2), 16).toString('2');
  }
  return bin;
}