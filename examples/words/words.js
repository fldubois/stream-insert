var fs = require('fs');

var StreamInsert = require('../..');

var input  = fs.createReadStream('input.txt');
var output = fs.createWriteStream('output.txt');

var insert = new StreamInsert('old', /friend/, {prepend: true, separator: ' '});

input.pipe(insert).pipe(output);
