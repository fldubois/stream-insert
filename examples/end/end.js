'use strict';

var fs = require('fs');
var path = require('path');

var StreamInsert = require('../..');

var input  = fs.createReadStream(path.join(__dirname, 'input.txt'));
var output = fs.createWriteStream(path.join(__dirname, 'output.txt'));

input.pipe(new StreamInsert('Line E\n', StreamInsert.EOF)).pipe(output);
