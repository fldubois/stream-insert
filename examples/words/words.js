'use strict';

var fs = require('fs');
var path = require('path');

var StreamInsert = require('../..');

var input  = fs.createReadStream(path.join(__dirname, 'input.txt'));
var output = fs.createWriteStream(path.join(__dirname, 'output.txt'));

var insert = new StreamInsert('old', /friend/, {prepend: true, separator: ' '});

input.pipe(insert).pipe(output);
