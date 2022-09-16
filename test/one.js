// 引入xqtime
const xqtime = require('../dist/xqtime');

// 年月日格式
const ymdDate = '2012-04-12 10:03:15';
let ymdResult = xqtime.friend(ymdDate);
console.log('ymd result: ', ymdResult);

// GMT格式
const gmtDate = new Date();
let gmtResult = xqtime.friend(gmtDate);
console.log('gmt result: ', gmtResult);

// 附件时间
let ymdAppendResult = xqtime.friend(ymdDate, true);
let gmtAppendResult = xqtime.friend(gmtDate, true);
console.log('ymd append: ', ymdAppendResult); // ymd append:  9年前(2012-03-04)
console.log('gmt append: ', gmtAppendResult); // gmt append:  刚刚(11:19:52)
