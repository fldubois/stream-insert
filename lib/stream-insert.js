'use strict';

var util = require('util');

var merge = require('merge');
var yatc  = require('yatc');

var Transform = require('stream').Transform;

var constants = {
  EOF: '\u0003'
};

var operators = {
  AND: 'AND',
  OR:  'OR'
};

var parsers = {
  insertions: function (insertions) {
    yatc.verify('insertions :: String | [String]', insertions);

    return Array.isArray(insertions) ? insertions : [insertions];
  },
  query: function (query) {
    yatc.verify('query :: Object | String | RegExp | [String | RegExp]', query);

    if (typeof query !== 'object' || query instanceof RegExp || Array.isArray(query)) {
      query = {
        searches: query
      };
    }

    query.searches = (Array.isArray(query.searches) ? query.searches : [query.searches]).map(function (search) {
      return (typeof search === 'string') ? new RegExp('^' + search + '$') : search;
    });

    if (typeof query.before === 'string') {
      query.before = new RegExp('^' + query.before + '$');
    }

    if (typeof query.after === 'string') {
      query.after = new RegExp('^' + query.after + '$');
    }

    return merge({
      operator: operators.AND,
      before:   null,
      after:    null,
      strict:   true
    }, query);
  },
  options: function (options) {
    options = (typeof options !== 'undefined') ? options : {};

    yatc.verify('options :: Object | String', options);

    if (typeof options === 'string') {
      options = {
        separator: options
      };
    }

    return merge({
      prepend:         false,
      separator:       '\n',
      limit:           -1,
      insertSeparator: true
    }, options);
  }
};

function StreamInsert(insertions, query, options) {
  if (!(this instanceof StreamInsert)) {
    return new StreamInsert(insertions, query, options);
  }

  Transform.call(this);

  this.insertions = parsers.insertions(insertions);
  this.query      = parsers.query(query);
  this.options    = parsers.options(options);

  this.count   = 0;
  this.current = 0;
  this.cache   = '';

  this.section = (this.query.after === null);

  this.glue = this.options.insertSeparator ? this.options.separator : '';
}

util.inherits(StreamInsert, Transform);

Object.keys(constants).forEach(function (property) {
  StreamInsert[property] = constants[property];
});

Object.keys(operators).forEach(function (property) {
  StreamInsert[property] = operators[property];
});

StreamInsert.prototype._check = function (piece) {
  if (this.options.limit > -1 && this.count >= this.options.limit) {
    return false;
  }

  // section start
  if (this.section === false && this.query.after !== null && this.query.after.test(piece)) {
    this.section = true;

    return !this.query.strict;
  }

  // section end
  if (this.section === true && this.query.before !== null && this.query.before.test(piece)) {
    this.section = false;

    return !this.query.strict;
  }

  return this.section;
};

StreamInsert.prototype._test = function (piece) {
  if (this.query.operator === operators.OR) {
    return this.query.searches.some(function (search) {
      return search.test(piece);
    });
  }

  // AND
  if (this.query.searches[this.current].test(piece)) {
    this.current = (this.current + 1) % this.query.searches.length;

    return (this.current === 0);
  }
};

StreamInsert.prototype._transform = function (chunk, encoding, done) {
  var pieces = (this.cache + chunk.toString()).split(this.options.separator);

  this.cache = pieces.pop();

  pieces.forEach(function (piece) {
    var pushes = [piece];

    if (this._check(piece) && this._test(piece)) {
      pushes[this.options.prepend ? 'unshift' : 'push'].apply(pushes, this.insertions);
      this.count++;
    }

    this.push(pushes.join(this.glue) + this.options.separator);
  }, this);

  done();
};

StreamInsert.prototype._flush = function (done) {
  var pieces = [this.cache];

  if (this._check(this.cache)) {
    if (this._test(this.cache)) {
      pieces[this.options.prepend ? 'unshift' : 'push'].apply(pieces, this.insertions);
    } else if (this._test(constants.EOF)) {
      pieces.push.apply(pieces, this.insertions);
    }
  }

  this.push(pieces.join(this.glue));

  done();
};

module.exports = StreamInsert;
