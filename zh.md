# xqtime

这是一个js时间友好化插件。

[查看英文文档](./README.md)

## 安装

**游览器端**:

引入cdn

```html
<!-- 游览器es5 -->
<script src="https://unpkg.com/xqtime/lib/xqtime.min.js"></script>
<!-- es6模块 -->
<script type="module">
    import xqtime from './lib/xqtime-esm.min.js';
</script>
```

**Node**:

```sh
npm install xqtime
```

```js
const xqtime = require('xqtime');
```

## 使用

### 格式说明

+ 年月日格式

```js
const ymdDate = '2012-04-12 10:03:15';
// 2012-04-12 10:03:15
```

+ GMT格式

```js
const gmtDate = new Date();
// Fri Nov 12 2021 10:20:54 GMT+0800 (中国标准时间)
```

### 使用案例

+ 1.一般案例

```js
// 调用friend方法
const ymdDate = '2012-04-12 10:03:15';
const gmtDate = new Date();
let ymdResult = xqtime.friend(ymdDate);
let gmtResult = xqtime.friend(gmtDate);
console.log('ymd result: ', ymdResult);
console.log('gmt result: ', gmtResult);
// ymd result:  9年前
// gmt result:  刚刚


// 附件时间
let ymdAppendResult = xqtime.friend(ymdDate, true);
let gmtAppendResult = xqtime.friend(gmtDate, true);
console.log('ymd append: ', ymdAppendResult); // ymd append:  9年前(2012-03-04)
console.log('gmt append: ', gmtAppendResult); // gmt append:  刚刚(11:19:52)
```

+ 2.全部案例

```js
// 当前时间
const now = new Date();
console.log('now is:', now); // now is: 2021-11-12T03:16:18.318Z

// 刚刚
const just = new Date();
let justResult = xqtime.friend(just);
console.log('just is:', justResult); // just is: 刚刚

// 分钟
const min = '2021-11-12 11:05:11';
let minResult = xqtime.friend(min);
console.log('min is:', minResult); // min is: 12分钟前

// 时
const hour = '2021-11-12 05:05:11';
let hourResult = xqtime.friend(hour);
console.log('hour is:', hourResult); // hour is: 6小时前

// 天
const day = '2021-11-08 11:05:11';
let dayResult = xqtime.friend(day);
console.log('day is:', dayResult); // day is: 4天前

// 月
const mon = '2021-05-12 11:05:11';
let monResult = xqtime.friend(mon);
console.log('mon is:', monResult); // mon is: 6月前

// 年
const year = '2012-11-12 11:05:11';
let yearResult = xqtime.friend(year);
console.log('year is:', yearResult); // year is: 9年前

// 世纪
const century = '1920-11-12 11:05:11';
let centuryResult = xqtime.friend(century);
console.log('min is:', centuryResult); // min is: 1世纪前

// 千年
const millennium = '960-11-12 11:05:11';
let millenniumResult = xqtime.friend(millennium);
console.log('millennium is:', millenniumResult); // millennium is: 1千年前

```

## 查看示例

运行这个脚本查看展示案例：`npm run test:node`, `npm run test:browser`。

## 提问题

[submit your question](https://github.com/xxx/xqtime/issues/new)

## 作者

[@xxx](https://github.com/xxx)
