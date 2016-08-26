'use strict';

var fs   = require('fs');
var path = require('path');

var StreamInsert = require('../..');

var input  = fs.createReadStream(path.join(__dirname, 'input.txt'));
var output = fs.createWriteStream(path.join(__dirname, 'output.txt'));

input.pipe(new StreamInsert(['Line 4', 'Line 5'], {
  searches: 'Line 3',
  after:    'Heading 2',
  before:   'Heading 3'
})).pipe(output);
