'use strict';

var expect = require('chai').expect;

var PassThrough = require('stream').PassThrough;

var StreamInsert = require('../../lib/stream-insert');

function insert(lines, stream, callback) {
  var input  = new PassThrough();
  var output = input.pipe(stream);
  var result = '';

  output.on('readable', function () {
    var line = output.read();

    while (line) {
      result += line.toString();
      line = output.read();
    }
  });

  output.on('end', function () {
    callback(null, result);
  });

  output.on('error', function (error) {
    callback(error);
  });

  if (typeof lines === 'string') {
    lines = [lines];
  }

  lines.forEach(function (line, index) {
    input.write(line + ((index < lines.length - 1) ? '\n' : ''));
  });

  input.end();
}

describe('StreamInsert', function () {

  it('should always create a StreamInsert instance', function () {
    expect(new StreamInsert('A', 'B')).to.be.an.instanceof(StreamInsert);
    expect(StreamInsert.call({}, 'A', 'B')).to.be.an.instanceof(StreamInsert);
    expect(StreamInsert('A', 'B')).to.be.an.instanceof(StreamInsert);
  });

  it('should throw a TypeError for bad `insertions` type', function () {
    [undefined, null, 1, true, {}].forEach(function (insertions) {
      expect(function () {
        return new StreamInsert(insertions, '');
      }).to.throw(TypeError);
    });
  });

  it('should throw a TypeError for bad `query` type', function () {
    [undefined, null, 1, true].forEach(function (query) {
      expect(function () {
        return new StreamInsert('', query);
      }).to.throw(TypeError);
    });
  });

  it('should throw a TypeError for bad `options` type', function () {
    [null, 1, true, []].forEach(function (options) {
      expect(function () {
        return new StreamInsert('', {}, options);
      }).to.throw(TypeError);
    });
  });

  it('should append the insertion after search', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', /^Line 2$/), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Appended line',
        'Line 3'
      ]);

      return done();
    });
  });

  it('should prepend the insertion after search', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', /^Line 2$/, {prepend: true}), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Appended line',
        'Line 2',
        'Line 3'
      ]);

      return done();
    });
  });

  it('should append multiple lines', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert(['Appended line 1', 'Appended line 2'], /^Line 2$/), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Appended line 1',
        'Appended line 2',
        'Line 3'
      ]);

      return done();
    });
  });

  it('should append the insertion after each search', function (done) {
    var lines = [
      'Line A',
      'Line searched',
      'Line B',
      'Line searched',
      'Line C'
    ];

    insert(lines, new StreamInsert('Appended line', /^Line searched$/), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line A',
        'Line searched',
        'Appended line',
        'Line B',
        'Line searched',
        'Appended line',
        'Line C'
      ]);

      return done();
    });
  });

  it('should append the insertion all searches matched', function (done) {
    var lines = [
      'Line A',
      'Line searched 1',
      'Line searched 2',
      'Line B',
      'Line searched 1',
      'Line C',
      'Line searched 1',
      'Line searched 2',
      'Line D',
      'Line searched 2',
      'Line C'
    ];

    insert(lines, new StreamInsert('Appended line', [
      /^Line searched 1$/,
      /^Line searched 2$/
    ]), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line A',
        'Line searched 1',
        'Line searched 2',
        'Appended line',
        'Line B',
        'Line searched 1',
        'Line C',
        'Line searched 1',
        'Line searched 2',
        'Appended line',
        'Line D',
        'Line searched 2',
        'Line C'
      ]);

      return done();
    });
  });

  it('should append the insertion when search matches the last line', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', /^Line 3$/), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Line 3',
        'Appended line'
      ]);

      return done();
    });
  });

  it('should prepend the insertion when search matches the last line', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', /^Line 3$/, {prepend: true}), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Appended line',
        'Line 3'
      ]);

      return done();
    });
  });

  it('should append the insertion at the end of file', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', StreamInsert.EOF, {prepend: true}), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Line 3',
        'Appended line'
      ]);

      return done();
    });
  });

  it('should not append the insertion after last line with remaining searches', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', [
      /^Line 3$/,
      /foo/
    ]), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Line 3'
      ]);

      return done();
    });
  });

  it('should not append the insertion at the end of file with remaining searches', function (done) {
    var lines = [
      'Line 1',
      'Line 2',
      'Line 3'
    ];

    insert(lines, new StreamInsert('Appended line', [
      StreamInsert.EOF,
      /foo/
    ]), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line 1',
        'Line 2',
        'Line 3'
      ]);

      return done();
    });
  });

  it('should accept strings as searches', function (done) {
    var lines = [
      'Line A',
      'Line AA',
      'Line AAA'
    ];

    insert(lines, new StreamInsert('Line B', 'Line AA'), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result.split('\n')).to.deep.equal([
        'Line A',
        'Line AA',
        'Line B',
        'Line AAA'
      ]);

      return done();
    });
  });

  it('should accept separator as third parameter', function (done) {
    insert('A B C D A B C D', new StreamInsert('E', /^D$/, ' '), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A B C D E A B C D E');

      return done();
    });
  });

  it('should accept the option separator', function (done) {
    insert('A B C D A B C D', new StreamInsert('E', /^D$/, {separator: ' '}), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A B C D E A B C D E');

      return done();
    });
  });

  it('should accept the option insertSeparator', function (done) {
    insert('A B C D A B C D', new StreamInsert('E', /^D$/, {
      separator: ' ',
      insertSeparator: false
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A B C DE A B C DE');

      return done();
    });
  });

  it('should accept the OR operator', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: [/^A$/, /^D$/],
      operator: StreamInsert.OR
    }, {
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A X B C D X A X B C D X');

      return done();
    });
  });

  it('should insert one time with the OR operator', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: [/^(A|C)$/, /^(D|C)$/],
      operator: StreamInsert.OR
    }, {
      prepend: true,
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('X A B X C X D X A B X C X D');

      return done();
    });
  });

  it('should accept the filter before as a RegExp', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: /.*/,
      before: /^D$/
    }, {
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A X B X C X D A B C D');

      return done();
    });
  });

  it('should accept the filter before as a string', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: /.*/,
      before: 'C'
    }, {
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A X B X C D A B C D');

      return done();
    });
  });

  it('should accept the filter after as a RegExp', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: /.*/,
      after: /^D$/
    }, {
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A B C D A X B X C X D X');

      return done();
    });
  });

  it('should accept the filter after as a string', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: /.*/,
      after: 'B'
    }, {
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A B C X D X A X B X C X D X');

      return done();
    });
  });

  it('should check boundaries on loose mode', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', {
      searches: /.*/,
      after: 'B',
      before: 'C',
      strict: false
    }, {
      separator: ' '
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A B X C X D A B X C X D');

      return done();
    });
  });

  it('should accept the option limit', function (done) {
    insert('A B C D A B C D', new StreamInsert('X', /.*/, {
      separator: ' ',
      limit: 4
    }), function (error, result) {
      if (error) {
        return done(error);
      }

      expect(result).to.equal('A X B X C X D X A B C D');

      return done();
    });
  });

});
