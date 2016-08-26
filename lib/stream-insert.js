'use strict';

var util = require('util');

var Transform = require('stream').Transform;

function StreamInsert(insertions, query, options) {
  if (!(this instanceof StreamInsert)) {
    return new StreamInsert(insertions, query, options);
  }

  Transform.call(this);

  options = options || {};

  this.insertions = Array.isArray(insertions) ? insertions : [insertions];

  if (typeof query !== 'object' || query instanceof RegExp || Array.isArray(query)) {
    query = {
      searches: query
    };
  }

  this.query = {
    searches: Array.isArray(query.searches) ? query.searches : [query.searches],
    operator: query.operator || StreamInsert.AND,
    before:   query.before   || null,
    after:    query.after    || null
  };

  this.query.searches = this.query.searches.map(function (search) {
    return (typeof search === 'string') ? new RegExp('^' + search + '$') : search;
  });

  this.options = {
    prepend:         options.prepend   || false,
    separator:       options.separator || '\n',
    limit:           options.limit     || -1,
    insertSeparator: (typeof options.insertSeparator !== 'undefined') ? options.insertSeparator : true
  };

  this.count   = 0;
  this.current = 0;
  this.cache   = '';

  this.section = (this.query.after === null);

  this.glue = this.options.insertSeparator ? this.options.separator : '';

  if (typeof this.query.before === 'string') {
    this.query.before = new RegExp('^' + this.query.before + '$');
  }

  if (typeof this.query.after === 'string') {
    this.query.after = new RegExp('^' + this.query.after + '$');
  }
}

util.inherits(StreamInsert, Transform);

StreamInsert.EOF = '\u0003';

StreamInsert.OR  = 'OR';
StreamInsert.AND = 'AND';

StreamInsert.prototype._transform = function (chunk, encoding, done) {
  var pieces = (this.cache + chunk.toString()).split(this.options.separator);

  this.cache = pieces.pop();

  pieces.forEach(function (piece) {
    var pushes = [piece];

    if (this.options.limit === -1 || this.count < this.options.limit) {
      if (this.section === true) {
        if (this.query.before !== null && this.query.before.test(piece)) {
          this.section = false;
        } else if (this.query.operator === StreamInsert.OR) {
          this.query.searches.some(function (search) {
            if (search.test(piece)) {
              pushes[this.options.prepend ? 'unshift' : 'push'].apply(pushes, this.insertions);

              this.count++;

              return true;
            }

            return false;
          }, this);
        } else if (this.query.searches[this.current].test(piece)) { // AND
          this.current = (this.current + 1) % this.query.searches.length;

          if (this.current === 0) {
            pushes[this.options.prepend ? 'unshift' : 'push'].apply(pushes, this.insertions);

            this.count++;
          }
        }
      } else if (this.query.after !== null && this.query.after.test(piece)) {
        this.section = true;
      }
    }

    this.push(pushes.join(this.glue) + this.options.separator);
  }, this);

  done();
};

StreamInsert.prototype._flush = function (done) {
  var pieces = [this.cache];

  if (this.section === true && (this.options.limit === -1 || this.count < this.options.limit)) {
    if (this.query.operator === StreamInsert.OR) {
      this.query.searches.some(function (search) {
        if (search.test(this.cache) || search.test(StreamInsert.EOF)) {
          pieces[this.options.prepend ? 'unshift' : 'push'].apply(pieces, this.insertions);

          return true;
        }

        return false;
      }, this);
    } else if (this.query.searches[this.current].test(this.cache)) {
      this.current = (this.current + 1) % this.query.searches.length;

      if (this.current === 0) {
        pieces[this.options.prepend ? 'unshift' : 'push'].apply(pieces, this.insertions);
      }
    } else if (this.query.searches[this.current].test(StreamInsert.EOF)) {
      this.current = (this.current + 1) % this.query.searches.length;

      if (this.current === 0) {
        pieces.push.apply(pieces, this.insertions);
      }
    }
  }

  this.push(pieces.join(this.glue));

  done();
};

module.exports = StreamInsert;
