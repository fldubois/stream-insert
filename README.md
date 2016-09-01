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
StreamInsert(insertions, query, options)
```

##### Parameters

| Parameter    | Type(s)                                              | Required | Default | Description                                                                                        |
| ------------ | ---------------------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------- |
| `insertions` | `string`, `string[]`                                 | *Yes*    |         | Strings to insert into the stream.                                                                 |
| `query`      | `object`, `string`, `string[]`, `RegExp`, `RegExp[]` | *Yes*    |         | Query object (see below) or RegExp(s)/string(s) used to detect where the strings will be inserted. |
| `options`    | `object`, `string`                                   | No       | `{}`    | Additional options. If a string is passed, set the separator option.                               |

##### Query

| Filter             | Type(s)                                    | Required | Default | Description                                                                                               |
| ------------------ | ------------------------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `searches`         | `string`, `string[]`, `RegExp`, `RegExp[]` | *Yes*    |         | RegExp(s)/string(s) used to detect where the strings will be inserted.                                    |
| `operator`         | `string`                                   | No       | `AND`   | If `AND`, insert after all searches are found (sequentially). If `OR`, insert after each matching search. |
| `before`           | `RegExp`, `string`                         | No       | `null`  | Don't insert after this RegExp matched.                                                                   |
| `after`            | `RegExp`, `string`                         | No       | `null`  | Don't insert until this RegExp matched.                                                                   |

##### Options

| Option             | Type(s)            | Required | Default | Description                                                                                               |
| ------------------ | ------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `prepend`          | `boolean`          | No       | `false` | Insert strings before the last match, after otherwise.                                                    |
| `separator`        | `string`           | No       | `\n`    | Separator used to split the stream. Default to `\n` to read the input stream line by line.                |
| `limit`            | `number`           | No       | `-1`    | Maximum number of insertions (-1 for infinity).                                                           |
| `insertSeparator`  | `boolean`          | No       | `true`  | If `true`, insert the separator between the insert and the matched string.                                |

## Examples

* [Insert lines into a file](examples/lines)
* [Insert words into a sentence](examples/words)
* [Insert lines between two boundaries](examples/section)
* [Insert a line at the end of a file](examples/end)
* [Insert a limited number of times](examples/limit)
