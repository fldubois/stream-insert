'use strict';

var util = require('util');

var Transform = require('stream').Transform;

function StreamInsert(insertions, searches, options) {
  if (!(this instanceof StreamInsert)) {
    return new StreamInsert(insertions, searches, options);
  }

  Transform.call(this);

  options = options || {};

  this.insertions = Array.isArray(insertions) ? insertions : [insertions];

  this.searches = (Array.isArray(searches) ? searches : [searches]).map(function (search) {
    return (typeof search === 'string') ? new RegExp('^' + search + '$') : search;
  });

  this.options = {
    operator:        options.operator  || 'AND',
    prepend:         options.prepend   || false,
    separator:       options.separator || '\n',
    before:          options.before    || null,
    after:           options.after     || null,
    insertSeparator: (typeof options.insertSeparator !== 'undefined') ? options.insertSeparator : true
  };

  this.current = 0;
  this.cache   = '';

  this.section = (this.options.after === null);

  this.glue = this.options.insertSeparator ? this.options.separator : '';

  if (typeof this.options.before === 'string') {
    this.options.before = new RegExp('^' + this.options.before + '$');
  }

  if (typeof this.options.after === 'string') {
    this.options.after = new RegExp('^' + this.options.after + '$');
  }
}

util.inherits(StreamInsert, Transform);

StreamInsert.EOF = '\u0003';

StreamInsert.prototype._transform = function (chunk, encoding, done) {
  var pieces = (this.cache + chunk.toString()).split(this.options.separator);

  this.cache = pieces.pop();

  pieces.forEach(function (piece) {
    var pushes = [piece];

    if (this.section === true) {
      if (this.options.before !== null && this.options.before.test(piece)) {
        this.section = false;
      } else if (this.options.operator === 'OR') {
        this.searches.some(function (search) {
          if (search.test(piece)) {
            pushes[this.options.prepend ? 'unshift' : 'push'].apply(pushes, this.insertions);

            return true;
          }

          return false;
        }, this);
      } else if (this.searches[this.current].test(piece)) { // AND
        this.current = (this.current + 1) % this.searches.length;

        if (this.current === 0) {
          pushes[this.options.prepend ? 'unshift' : 'push'].apply(pushes, this.insertions);
        }
      }
    } else if (this.options.after !== null && this.options.after.test(piece)) {
      this.section = true;
    }

    this.push(pushes.join(this.glue) + this.options.separator);
  }, this);

  done();
};

StreamInsert.prototype._flush = function (done) {
  var pieces = [this.cache];

  if (this.section === true) {
    if (this.options.operator === 'OR') {
      this.searches.some(function (search) {
        if (search.test(this.cache) || search.test(StreamInsert.EOF)) {
          pieces[this.options.prepend ? 'unshift' : 'push'].apply(pieces, this.insertions);

          return true;
        }

        return false;
      }, this);
    } else if (this.searches[this.current].test(this.cache)) {
      this.current = (this.current + 1) % this.searches.length;

      if (this.current === 0) {
        pieces[this.options.prepend ? 'unshift' : 'push'].apply(pieces, this.insertions);
      }
    } else if (this.searches[this.current].test(StreamInsert.EOF)) {
      this.current = (this.current + 1) % this.searches.length;

      if (this.current === 0) {
        pieces.push.apply(pieces, this.insertions);
      }
    }
  }

  this.push(pieces.join(this.glue));

  done();
};

module.exports = StreamInsert;
