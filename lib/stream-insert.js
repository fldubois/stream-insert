'use strict';

var util = require('util');

var Transform = require('stream').Transform;

module.exports = function StreamInsert(insertions, searches, options) {
  if (!(this instanceof StreamInsert)) {
    return new StreamInsert(insertions, searches, options);
  }

  Transform.call(this);

  options = options || {};

  this.insertions = Array.isArray(insertions) ? insertions : [insertions];
  this.searches   = Array.isArray(searches)   ? searches   : [searches];

  this.options = {
    prepend:         options.prepend   || false,
    separator:       options.separator || '\n',
    insertSeparator: (typeof options.insertSeparator !== 'undefined') ? options.insertSeparator : true
  };

  this.current = 0;
  this.cache   = '';

  this.glue = this.options.insertSeparator ? this.options.separator : '';
};

var StreamInsert = module.exports;

util.inherits(StreamInsert, Transform);

StreamInsert.prototype._transform = function (chunk, encoding, done) {
  var lines = (this.cache + chunk.toString()).split(this.options.separator);

  this.cache = lines.pop();

  lines.forEach(function (line) {
    var pushes = [line];

    if (this.searches[this.current].test(line)) {
      this.current = (this.current + 1) % this.searches.length;

      if (this.current === 0) {
        pushes[this.options.prepend ? 'unshift' : 'push'].apply(pushes, this.insertions);
      }
    }

    this.push(pushes.join(this.glue) + this.options.separator);
  }, this);

  done();
};

StreamInsert.prototype._flush = function (done) {
  var lines = [this.cache];

  if (this.searches[this.current].test(this.cache)) {
    this.current = (this.current + 1) % this.searches.length;

    if (this.current === 0) {
      lines[this.options.prepend ? 'unshift' : 'push'].apply(lines, this.insertions);
    }
  } else if (this.searches[this.current].test('\u0003')) {
    this.current = (this.current + 1) % this.searches.length;

    if (this.current === 0) {
      lines.push.apply(lines, this.insertions);
    }
  }

  this.push(lines.join(this.glue));

  done();
};
