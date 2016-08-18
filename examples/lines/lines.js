var fs = require('fs');

var StreamInsert = require('../..');

var input  = fs.createReadStream('input.txt');
var output = fs.createWriteStream('output.txt');

input.pipe(new StreamInsert([
  'Line X',
  'Line Y'
], [
  /^Line A$/,
  /^Line B$/,
])).pipe(output);
