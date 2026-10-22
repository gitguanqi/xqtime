/**
 * 产物契约测试：六个交付文件必须彼此一致，且每条消费路径都能真的跑起来。
 *
 * - 行为矩阵：可读/压缩 × UMD/ESM 四份产物对同一批用例必须给出完全相同的输出
 * - 旧文件名是 canonical 产物的字节副本，不是 shim
 * - UMD 的 CJS / AMD / CMD / 浏览器全局四条分支
 * - banner 版本号与 package.json 一致
 */
import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

import { checkAgentMetadata } from '../scripts/check-agent-metadata.mjs';

const require = createRequire(import.meta.url);

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const read = (name) => readFileSync(new URL(`../lib/${name}`, import.meta.url), 'utf8');

test('发布包包含可发现的 llms.txt 元数据', async () => {
    await checkAgentMetadata();
});

const artifactNames = [
    'xqtime.js',
    'xqtime.min.js',
    'xqtime-esm.mjs',
    'xqtime-esm.min.mjs',
];

// 载入四份产物（外加两个 legacy 别名由字节比对覆盖，不在 Node 里 import：
// 它们是 .js 后缀的 ESM，Node 18/20 直接 import 会抛错）
const umd = require('../lib/xqtime.js');
const umdMin = require('../lib/xqtime.min.js');
const esm = await import('../lib/xqtime-esm.mjs');
const esmMin = await import('../lib/xqtime-esm.min.mjs');

const implementations = [
    ['lib/xqtime.js', (t, a) => umd.friend(t, a)],
    ['lib/xqtime.min.js', (t, a) => umdMin.friend(t, a)],
    ['lib/xqtime-esm.mjs', (t, a) => esm.default.friend(t, a)],
    ['lib/xqtime-esm.min.mjs', (t, a) => esmMin.default.friend(t, a)],
];

const TARGET = new Date(2021, 0, 5, 10, 3, 15);
const TARGET_MS = TARGET.getTime();
const SECOND = 1000;
const YEAR = 365 * 24 * 60 * 60 * SECOND;

describe('产物文件', () => {
    test('六个产物都存在且非空', () => {
        for (const name of artifactNames.concat(['xqtime-esm.js', 'xqtime-esm.min.js'])) {
            const text = read(name);
            assert.ok(text.length > 100, `${name} 内容过短`);
        }
    });

    test('旧文件名是 canonical 产物的字节副本', () => {
        assert.deepEqual(readFileSync(new URL('../lib/xqtime-esm.js', import.meta.url)),
            readFileSync(new URL('../lib/xqtime-esm.mjs', import.meta.url)));
        assert.deepEqual(readFileSync(new URL('../lib/xqtime-esm.min.js', import.meta.url)),
            readFileSync(new URL('../lib/xqtime-esm.min.mjs', import.meta.url)));
    });

    test('banner 版本号与 package.json 一致', () => {
        for (const name of artifactNames) {
            const matched = /version:\s*([0-9A-Za-z.\-+]+)/.exec(read(name));
            assert.ok(matched, `${name} 缺少版本 banner`);
            assert.equal(matched[1], pkg.version, `${name} 版本与 package.json 不一致`);
        }
    });

    test('压缩产物没有把中文转成 \\u 转义', () => {
        for (const name of ['xqtime.min.js', 'xqtime-esm.min.mjs']) {
            assert.ok(!read(name).includes('\\u'), `${name} 含 \\u 转义`);
            assert.ok(read(name).includes('刚刚'), `${name} 缺少中文文案`);
        }
    });

    test('UMD 用 globalThis 链取全局对象，不依赖顶层 this', () => {
        for (const name of ['xqtime.js', 'xqtime.min.js']) {
            const text = read(name);
            assert.ok(text.includes("typeof globalThis !== 'undefined'"), `${name} 未用 globalThis`);
            assert.ok(text.includes('typeof self'), `${name} 缺少 self 回退`);
        }
    });

    test('ESM 产物同时提供默认导出与命名导出 friend', async () => {
        for (const mod of [esm, esmMin]) {
            assert.equal(typeof mod.default.friend, 'function');
            assert.equal(typeof mod.friend, 'function');
            assert.equal(mod.default.friend, mod.friend);
        }
    });
});

describe('行为一致性', () => {
    const offsets = [0, 59, 60, 61, 3599, 3600, 3601, 86399, 86400, 86401,
        2591999, 2592000, 31535999, 31536000, 3153600000, 31536000000,
        315360000000, -1, -86400].map((value) => value * SECOND);

    before(() => {
        mock.timers.enable({ apis: ['Date'], now: TARGET_MS + 3 * YEAR });
    });
    after(() => mock.timers.reset());

    test('四份产物对 19 个时间点 × append 两态输出完全相同', () => {
        for (const offset of offsets) {
            const date = new Date(TARGET_MS - offset);
            for (const append of [false, true]) {
                const results = implementations.map(([name, run]) => {
                    const value = run(date, append);
                    return [name, value];
                });
                const reference = results[0][1];
                for (const [name, value] of results) {
                    assert.equal(value, reference,
                        `${name} 在 offset=${offset} append=${append} 时与 ${results[0][0]} 不一致`);
                }
            }
        }
    });

    test('字符串入参在各产物上一致', () => {
        for (const input of ['2012-04-12 10:03:15', '2012-04-12', '2021-12-25 10:03:15']) {
            for (const append of [false, true]) {
                const values = implementations.map(([, run]) => run(input, append));
                assert.equal(new Set(values).size, 1, `入参 ${input} 的输出不一致：${values.join(' | ')}`);
            }
        }
    });

    test('非法入参在各产物上同样抛 TypeError', () => {
        for (const [name, run] of implementations) {
            assert.throws(() => run('not-a-date'), TypeError, `${name} 未抛错`);
            assert.throws(() => run(null), TypeError, `${name} 未抛错`);
        }
    });
});

describe('UMD 四条分支', () => {
    const code = read('xqtime.js');
    const minCode = read('xqtime.min.js');

    test('CJS：require 得到 { friend }', () => {
        assert.deepEqual(Object.keys(umd), ['friend']);
        assert.deepEqual(Object.keys(umdMin), ['friend']);
    });

    test('浏览器全局：挂到 root.xqtime', () => {
        for (const source of [code, minCode]) {
            const sandbox = {};
            vm.runInNewContext(source, sandbox);
            assert.equal(typeof sandbox.xqtime.friend, 'function');
            // 用当前时间断言，避免依赖真实时钟
            assert.equal(sandbox.xqtime.friend(Date.now()), '刚刚');
        }
    });

    test('AMD：define(factory) 拿到对象', () => {
        for (const source of [code, minCode]) {
            let received;
            const sandbox = {
                define: (factory) => {
                    received = typeof factory === 'function' ? factory() : factory;
                },
            };
            sandbox.define.amd = {};
            vm.runInNewContext(source, sandbox);
            assert.equal(typeof received.friend, 'function');
        }
    });

    test('CMD：define(function (require, exports, module) {...})', () => {
        for (const source of [code, minCode]) {
            let received;
            const sandbox = {
                define: (factory) => {
                    const mod = { exports: {} };
                    factory(null, null, mod);
                    received = mod.exports;
                },
            };
            sandbox.define.cmd = {};
            vm.runInNewContext(source, sandbox);
            assert.equal(typeof received.friend, 'function');
        }
    });

    test('globalThis 与 self 都不可用时回退到 this', () => {
        // 旧版直接以顶层 this 作 root；这里把前两个回退项遮成 undefined，
        // 验证 globalThis -> self -> this 的降级链仍然成立。
        const sandbox = { globalThis: undefined, self: undefined };
        vm.runInNewContext(code, sandbox);
        assert.equal(typeof sandbox.xqtime.friend, 'function');
    });
});
