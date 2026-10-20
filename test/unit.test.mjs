/**
 * 行为单元测试：针对交付产物 lib/xqtime-esm.mjs（也就是 npm 上 import 到的那份代码）。
 *
 * 时间冻结用 node:test 的 mock.timers(Date)，可以精确断言 59.999s / 60s 这类阈值边界。
 * 该能力需要 Node >= 21.2，低版本自动跳过整组用例而不是给出假失败。
 */
import { describe, test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

import xqtime, { friend } from '../lib/xqtime-esm.mjs';

const canFreezeDate = typeof mock.timers === 'object' && typeof mock.timers.enable === 'function';
const skipReason = canFreezeDate ? false : '当前 Node 不支持 mock.timers(Date)（需 >= 21.2）';

// 统一的目标时间：用本地分量构造，附带时间的期望值因此与时区无关。
const TARGET = new Date(2021, 0, 5, 10, 3, 15); // 2021-01-05 10:03:15 本地时间
const TARGET_MS = TARGET.getTime();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

function freezeNow(nowMs) {
    mock.timers.reset();
    mock.timers.enable({ apis: ['Date'], now: nowMs });
}

// now = 目标时间 + offset，于是「时间差」正好等于 offset
function freezeAtOffset(offsetMs) {
    freezeNow(TARGET_MS + offsetMs);
}

describe('导出形状', () => {
    test('默认导出与命名导出指向同一个函数', () => {
        assert.equal(typeof xqtime.friend, 'function');
        assert.equal(typeof friend, 'function');
        assert.equal(xqtime.friend, friend);
    });

    test('默认导出只有 friend 一个键', () => {
        assert.deepEqual(Object.keys(xqtime), ['friend']);
    });
});

describe('档位与阈值边界', { skip: skipReason }, () => {
    before(() => {
        // 允许在 before 里直接启用，避免每个用例重复开关
        freezeNow(TARGET_MS);
    });
    after(() => mock.timers.reset());

    const levelCases = [
        // [时间差, 期望]
        [0, '刚刚'],
        [59 * SECOND, '刚刚'],
        [60 * SECOND, '1分钟前'],
        [61 * SECOND, '1分钟前'],
        [59 * MINUTE + 59 * SECOND, '59分钟前'],
        [HOUR, '1小时前'],
        [2 * HOUR, '2小时前'],
        [23 * HOUR + 59 * MINUTE + 59 * SECOND, '23小时前'],
        [DAY, '1天前'],
        [4 * DAY, '4天前'],
        [29 * DAY + 23 * HOUR + 59 * MINUTE + 59 * SECOND, '29天前'],
        [MONTH, '1月前'],
        [6 * MONTH, '6月前'],
        [YEAR - SECOND, '12月前'],
        [YEAR, '1年前'],
        [2 * YEAR, '2年前'],
        [100 * YEAR, '1世纪前'],
        [150 * YEAR, '1世纪前'],
        [1000 * YEAR, '1千年前'],
        [5000 * YEAR, '5千年前'],
        [10000 * YEAR, '1万年前'],
        [50000 * YEAR, '5万年前'],
    ];

    for (const [offset, expected] of levelCases) {
        test(`${offset / 1000}s 前 → ${expected}`, () => {
            freezeAtOffset(offset);
            assert.equal(friend(TARGET), expected);
        });
    }

    test('未来时间显示「刚刚」', () => {
        freezeAtOffset(-DAY);
        assert.equal(friend(TARGET), '刚刚');
    });

    test('省略入参时使用当前时间', () => {
        freezeNow(TARGET_MS);
        assert.equal(friend(), '刚刚');
        assert.equal(friend(undefined, true), '刚刚(10:03:15)');
    });

    test('数字时间戳与 Date 等价', () => {
        freezeAtOffset(2 * DAY);
        assert.equal(friend(TARGET_MS), friend(TARGET));
        assert.equal(friend(TARGET_MS, true), '2天前(01-05)');
    });
});

describe('附带时间格式', { skip: skipReason }, () => {
    after(() => mock.timers.reset());

    const appendCases = [
        [0, '刚刚(10:03:15)'],
        [12 * MINUTE, '12分钟前(10:03:15)'],
        [3 * HOUR, '3小时前(10:03:15)'],
        [3 * DAY, '3天前(01-05)'],
        [3 * MONTH, '3月前(01-05)'],
        [3 * YEAR, '3年前(2021-01-05)'],
        [150 * YEAR, '1世纪前(2021-01-05)'],
        [5000 * YEAR, '5千年前(2021-01-05)'],
    ];

    for (const [offset, expected] of appendCases) {
        test(`${expected}`, () => {
            freezeAtOffset(offset);
            assert.equal(friend(TARGET, true), expected);
        });
    }

    // 回归：旧版用 getDay() 当日、并在补零后再 +1，导致 1-10 月与所有日期都错。
    const monthDayCases = [
        [new Date(2021, 0, 5, 10, 3, 15), '2021-01-05'],
        [new Date(2021, 9, 5, 10, 3, 15), '2021-10-05'],
        [new Date(2021, 11, 25, 10, 3, 15), '2021-12-25'],
        [new Date(2021, 3, 12, 10, 3, 15), '2021-04-12'],
        [new Date(2021, 5, 1, 0, 0, 0), '2021-06-01'],
    ];

    for (const [date, expected] of monthDayCases) {
        test(`年月日补零：${expected}`, () => {
            freezeNow(date.getTime() + 3 * YEAR);
            assert.equal(friend(date, true), `3年前(${expected})`);
        });
    }

    test('远古年份补足 4 位', () => {
        const ancient = new Date(0);
        ancient.setFullYear(960, 10, 12);
        ancient.setHours(11, 5, 11, 0);
        freezeNow(ancient.getTime() + 5000 * YEAR);
        assert.equal(friend(ancient, true), '5千年前(0960-11-12)');
    });

    test('旧版世纪档位输出空括号，现输出完整年月日', () => {
        const centuryAgo = new Date(1920, 10, 12, 11, 5, 11);
        freezeNow(centuryAgo.getTime() + 150 * YEAR);
        assert.equal(friend(centuryAgo, true), '1世纪前(1920-11-12)');
        assert.ok(!friend(centuryAgo, true).includes('()'));
    });
});

describe('非法入参', { skip: skipReason }, () => {
    before(() => freezeNow(TARGET_MS + DAY));
    after(() => mock.timers.reset());

    const invalid = [
        ['无法解析的字符串', 'not-a-date'],
        ['空字符串', ''],
        ['null', null],
        ['true', true],
        ['对象', {}],
        ['数组', []],
        ['NaN', NaN],
        ['Infinity', Infinity],
    ];

    for (const [label, input] of invalid) {
        test(`${label} 抛 TypeError`, () => {
            assert.throws(() => friend(input), TypeError);
            assert.throws(() => friend(input, true), TypeError);
        });
    }

    test('无效 Date 抛 TypeError', () => {
        assert.throws(() => friend(new Date('x')), TypeError);
    });

    test('日期分量溢出抛 TypeError', () => {
        assert.throws(() => friend('2021-02-30'), TypeError);
        assert.throws(() => friend('2021-13-01'), TypeError);
        assert.throws(() => friend('2021-04-12 25:00:00'), TypeError);
    });

    test('错误信息包含 xqtime 前缀，便于定位', () => {
        assert.throws(
            () => friend('nope'),
            (error) => error instanceof TypeError && error.message.startsWith('xqtime: '),
        );
    });
});

describe('字符串解析（本地时区）', { skip: skipReason }, () => {
    after(() => mock.timers.reset());

    test('"YYYY-MM-DD HH:mm:ss" 按本地时间解析', () => {
        const expected = new Date(2012, 3, 12, 10, 3, 15).getTime();
        freezeNow(expected + 2 * YEAR);
        assert.equal(friend('2012-04-12 10:03:15', true), '2年前(2012-04-12)');
    });

    test('"YYYY-MM-DD" 不再被当成 UTC 零点', () => {
        // 若按 UTC 解析，在 GMT+8 下目标会变成 08:00，时间差变负 → 显示「刚刚」
        const localMidnight = new Date(2012, 3, 12, 0, 0, 0).getTime();
        freezeNow(localMidnight + 30 * MINUTE);
        assert.equal(friend('2012-04-12', true), '30分钟前(00:00:00)');
    });

    test('"YYYY-MM-DDTHH:mm:ss" 与空格分隔等价', () => {
        const a = new Date(2012, 3, 12, 10, 3, 15).getTime();
        freezeNow(a + 90 * MINUTE);
        assert.equal(friend('2012-04-12T10:03:15'), friend('2012-04-12 10:03:15'));
        assert.equal(friend('2012-04-12T10:03:15'), '1小时前');
    });

    test('带时区后缀的 ISO 串交给 Date.parse', () => {
        freezeNow(Date.parse('2021-11-12T03:16:18.318Z') + 4 * YEAR);
        assert.equal(friend('2021-11-12T03:16:18.318Z'), '4年前');
    });

    test('首尾空白被忽略', () => {
        const expected = new Date(2012, 3, 12, 10, 3, 15).getTime();
        freezeNow(expected + 2 * YEAR);
        assert.equal(friend('  2012-04-12 10:03:15  '), '2年前');
    });
});
