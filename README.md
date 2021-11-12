# xqtime

This is a js time-friendly plugin.

[View Chinese documents](./zh.md)

## Instructions

### Install xqtime

+ npm

```sh
$ npm install xqtime
```

+ cdn

```html
<!-- unkpg -->
<!-- 1.nodejs -->
<script src="https://unpkg.com/xqtime/lib/xqtime.min.js"></script>

<!-- 2.es5 -->
<script src="https://unpkg.com/xqtime/lib/xqtime-es5.min.js"></script>

<!-- 3.es6 -->
<script src="https://unpkg.com/xqtime/lib/xqtime-es6.min.js"></script>
```

### Introducing xqtime

`const xqtime = require('xqtime');`

## Format description

+ Year month day format

```js
const ymdDate = '2012-04-12 10:03:15';
// 2012-04-12 10:03:15
```

+ GMT format

```js
const gmtDate = new Date();
// Fri Nov 12 2021 10:20:54 GMT+0800 (中国标准时间)
```

### Use Cases

+ 1. General case

`node ./test/index.js`;

```js
// ./test/index.js
// call the friend method
const ymdDate = '2012-04-12 10:03:15';
const gmtDate = new Date();
let ymdResult = xqtime.friend(ymdDate);
let gmtResult = xqtime.friend(gmtDate);
console.log('ymd result:', ymdResult);
console.log('gmt result:', gmtResult);
// ymd result: 9 years ago
// gmt result: just now


// Attachment time
let ymdAppendResult = xqtime.friend(ymdDate, true);
let gmtAppendResult = xqtime.friend(gmtDate, true);
console.log('ymd append:', ymdAppendResult); // ymd append: 9 years ago (2012-03-04)
console.log('gmt append:', gmtAppendResult); // gmt append: just now (11:19:52)
```

+ 2. All cases

`node ./test/all.js`;

```js
// ./test/all.js
// current time
const now = new Date();
console.log('now is:', now); // now is: 2021-11-12T03:16:18.318Z

// just
const just = new Date();
let justResult = xqtime.friend(just);
console.log('just is:', justResult); // just is: just

// minute
const min = '2021-11-12 11:05:11';
let minResult = xqtime.friend(min);
console.log('min is:', minResult); // min is: 12 minutes ago

// Time
const hour = '2021-11-12 05:05:11';
let hourResult = xqtime.friend(hour);
console.log('hour is:', hourResult); // hour is: 6 hours ago

// day
const day = '2021-11-08 11:05:11';
let dayResult = xqtime.friend(day);
console.log('day is:', dayResult); // day is: 4 days ago

// moon
const mon = '2021-05-12 11:05:11';
let monResult = xqtime.friend(mon);
console.log('mon is:', monResult); // mon is: 6 months ago

// year
const year = '2012-11-12 11:05:11';
let yearResult = xqtime.friend(year);
console.log('year is:', yearResult); // year is: 9 years ago

// century
const century = '1920-11-12 11:05:11';
let centuryResult = xqtime.friend(century);
console.log('min is:', centuryResult); // min is: 1st century ago

// Millennium
const millennium = '960-11-12 11:05:11';
let millenniumResult = xqtime.friend(millennium);
console.log('millennium is:', millenniumResult); // millennium is: 1 thousand years ago

```

### How to use ES5

Reference: test/es5.html

+ Introduce js

```html
<script src="https://unpkg.com/xqtime/lib/xqtime-es5.min.js"></script>
```

+ Call method

```js
const ymdDate = '2012-04-12 10:03:15';
const gmtDate = new Date();
let ymdResult = xqtime.friend(ymdDate);
let gmtResult = xqtime.friend(gmtDate);
console.log('ymd result:', ymdResult);
console.log('gmt result:', gmtResult);
```

### How to use ES6

Reference: test/es5.html

+ Introduce js

```html
<script src="https://unpkg.com/xqtime/lib/xqtime-es6.min.js"></script>
```

+ Call method

```html
<script type="module">
     import xqtime from'../lib/xqtime-es6.min.js';
     const ymdDate = '2012-04-12 10:03:15';
     const gmtDate = new Date();
     let ymdResult = xqtime.friend(ymdDate);
     let gmtResult = xqtime.friend(gmtDate);
     console.log('ymd result:', ymdResult);
     console.log('gmt result:', gmtResult);
</script>
```
## ask questions

[submit your question](https://github.com/gitguanqi/xqtime/issues/new)

## Author

[@gitguanqi](https://github.com/gitguanqi)
