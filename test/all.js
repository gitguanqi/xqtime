// 引入xqtime
const xqtime = require('../index');

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
