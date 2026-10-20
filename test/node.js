/**
 * Node 消费路径的快速自检（npm run test:node）。
 *
 * 这是人肉可读的冒烟脚本，不是完整测试套件——完整断言在 test/unit.test.mjs
 * 与 test/artifacts.test.mjs，用 `npm test` 运行。
 * 所有期望值都由 Date.now() 推算，不会随时间推移而失真。
 */
const assert = require('node:assert');
const xqtime = require('../lib/xqtime');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

let failed = 0;

function check(label, actual, expected) {
    try {
        assert.strictEqual(actual, expected);
        console.log(`PASS  ${label}  ->  ${actual}`);
    } catch {
        failed += 1;
        console.log(`FAIL  ${label}  ->  期望 ${expected}，实际 ${actual}`);
    }
}

const pad = (value) => (value < 10 ? '0' + value : String(value));

// 附带时间里的日期部分，按本地分量推算
function datePartOf(result) {
    return result.slice(result.indexOf('(') + 1, result.length - 1);
}

function expectedDatePart(date) {
    const year = date.getFullYear() < 0
        ? '-' + String(-date.getFullYear()).padStart(6, '0')
        : String(date.getFullYear()).padStart(4, '0');
    return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function expectedYears(date) {
    return Math.floor((Date.now() - date.getTime()) / YEAR) + '年前';
}

console.log('require("../lib/xqtime") =', typeof xqtime, Object.keys(xqtime));
console.log('');

check('省略入参', xqtime.friend(), '刚刚');
check('30 秒前', xqtime.friend(Date.now() - 30 * SECOND), '刚刚');
check('12 分钟前', xqtime.friend(Date.now() - 12 * MINUTE), '12分钟前');
check('3 小时前', xqtime.friend(Date.now() - 3 * HOUR), '3小时前');
check('2 天前', xqtime.friend(Date.now() - 2 * DAY), '2天前');
check('3 个月前', xqtime.friend(Date.now() - 90 * DAY), '3月前');
check('2 年前', xqtime.friend(Date.now() - 2 * YEAR), '2年前');

// 附带时间：日的取值与月份补零是 0.2.0 修掉的两个缺陷
const fixed = new Date(2021, 9, 5, 10, 3, 15); // 2021-10-05 10:03:15 本地时间
check('Date 入参的相对部分', xqtime.friend(fixed), expectedYears(fixed));
check('Date 入参 + append 的日期部分', datePartOf(xqtime.friend(fixed, true)), expectedDatePart(fixed));
check('时间戳入参与 Date 入参一致', xqtime.friend(fixed.getTime(), true), xqtime.friend(fixed, true));

// 字符串按本地时区解析：'2021-10-05' 不应被当成 UTC 零点
const fromString = xqtime.friend('2021-10-05 10:03:15', true);
check('字符串入参 + append 的日期部分', datePartOf(fromString), '2021-10-05');

// 非法入参
try {
    xqtime.friend('not-a-date');
    failed += 1;
    console.log('FAIL  非法入参应抛 TypeError，实际没有抛错');
} catch (error) {
    if (error instanceof TypeError) {
        console.log(`PASS  非法入参抛 TypeError  ->  ${error.message}`);
    } else {
        failed += 1;
        console.log(`FAIL  期望 TypeError，实际 ${error.constructor.name}`);
    }
}

console.log('');
console.log(failed === 0 ? '全部通过' : `${failed} 项失败`);
process.exitCode = failed === 0 ? 0 : 1;
