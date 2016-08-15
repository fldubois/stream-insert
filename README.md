# stream-insert

> Transform stream which insert text into the passing stream

## Usage

`stream-insert` implements the [Tranform Stream API](https://nodejs.org/api/stream.html#stream_implementing_a_transform_stream).

```js
var fs = require('fs');

var StreamInsert = require('stream-insert');

var insert = new StreamInsert('Line to append', /^Searched line$/);

fs.createReadStream('input.txt').pipe(insert).pipe(fs.createWriteStream('output.txt'));
```

## API

```js
StreamInsert(insertions, searches, options)
```

##### Parameters

| Parameter    | Type(s)              | Required | Default | Description                                                                                |
| ------------ | -------------------- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| `insertions` | `string`, `string[]` | *Yes*    |         | Lines to insert in the stream.                                                             |
| `searches`   | `RegExp`, `RegExp[]` | *Yes*    |         | Regular expressions used to detect where the lines will be inserted.                       |
| `options`    | `object`             | No       | `{}`    | Additional options.                                                                        |

##### Options

| Option             | Type(s)   | Required | Default | Description                                                                                               |
| ------------------ | --------- | -------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `operator`         | `string`  | No       | `AND`   | If `AND`, insert after all searches are found (sequentially). If `OR`, insert after each matching search. |
| `prepend`          | `boolean` | No       | `false` | Insert lines before the last match, after otherwise.                                                      |
| `separator`        | `string`  | No       | `\n`    | Separator used to split the stream. Default to `\n` to read the input stream line by line.                |
| `insertSeparator`  | `boolean` | No       | `true`  | If `true`, insert the separator between the insert and the matched string.                                |
| `before`           | `RegExp`  | No       | `null`  | Don't insert after this RegExp matched.                                                                   |

## Examples

### Insert lines into a file

#### _input.txt_

```
Line C
Line B
Line A
Line B
Line A
Line D
```

#### Code

```js
var fs = require('fs');

var StreamInsert = require('stream-insert');

fs.createReadStream('input.txt').pipe(new StreamInsert([
  'Line X',
  'Line Y'
], [
  /^Line A$/,
  /^Line B$/,
])).pipe(fs.createWriteStream('output.txt'));
```

#### _output.txt_

```
Line C
Line B
Line A
Line B
Line X
Line Y
Line A
Line D
```

### Append words into a sentence

#### _input.txt_

```
Hello, friend.
```

#### Code

```js
var fs = require('fs');

var StreamInsert = require('stream-insert');

var insert = new StreamInsert('old', /friend/, {prepend: true, separator: ' '});

fs.createReadStream('input.txt').pipe(insert).pipe(fs.createWriteStream('output.txt'));
```

#### _output.txt_

```
Hello, old friend.
```
