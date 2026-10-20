/**
 * 页面契约测试：不启动浏览器，只静态断言 test/*.html 的结构契约，
 * 防止页面退回「只往 console 打印、没有可见 PASS/FAIL」的旧形态。
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(path.join(HERE, name), 'utf8');

describe('页面契约', () => {
    const pages = ['browser.html', 'esm.html', 'amd.html'];

    for (const page of pages) {
        describe(page, () => {
            const html = read(page);

            it('声明 UTF-8 编码', () => {
                assert.match(html, /<meta charset="UTF-8">/i);
            });

            it('根元素带 pending 初始态', () => {
                assert.match(html, /data-demo-status="pending"/);
            });

            it('包含可见状态元素 #status 且初始为 PENDING', () => {
                assert.match(html, /id="status"[^>]*>PENDING/);
            });

            it('引用共享执行器 demo-runner.js', () => {
                assert.match(html, /src="demo-runner\.js"/);
            });

            it('引用共享样式 demo.css', () => {
                assert.match(html, /href="demo\.css"/);
            });

            it('调用共享执行器产出 window.__xqtimeDemo', () => {
                assert.match(html, /xqtimeDemoRun\(/);
            });

            it('不再依赖 console 打印作为唯一输出', () => {
                assert.doesNotMatch(html, /console\.log/);
            });

            it('通过 http 服务访问时可拿到产物（相对路径指向 ../lib）', () => {
                assert.match(html, /\.\.\/lib\//);
            });
        });
    }

    describe('browser.html 专属', () => {
        const html = read('browser.html');

        it('以普通 script 加载 UMD 产物', () => {
            assert.match(html, /src="\.\.\/lib\/xqtime\.js"/);
            assert.match(html, /window\.xqtime/);
        });
    });

    describe('esm.html 专属', () => {
        const html = read('esm.html');

        it('以 module 方式加载 .mjs 产物', () => {
            assert.match(html, /type="module"/);
            assert.match(html, /import\s+.*from\s+'\.\.\/lib\/xqtime-esm\.mjs'/);
        });

        it('同时验证 default 导出与命名导出', () => {
            assert.match(html, /import xqtime, \{ friend \}/);
            assert.match(html, /friend !== xqtime\.friend/);
        });
    });

    describe('amd.html 专属', () => {
        const html = read('amd.html');

        it('加载 RequireJS 并以 amd.js 为入口', () => {
            assert.match(html, /require(\.min)?\.js/);
            assert.match(html, /requirejs\(\['amd'\]/);
        });

        it('RequireJS 缺失或超时会给出可见 FAIL，不停在 PENDING', () => {
            assert.match(html, /RequireJS 未加载成功/);
            assert.match(html, /setTimeout/);
        });
    });

    describe('amd.js 模块守卫', () => {
        const source = read('amd.js');

        it('只在 define.amd 存在时注册 AMD 模块', () => {
            assert.match(source, /typeof define === 'function' && define\.amd/);
        });

        it('提供 CommonJS 冒烟分支（require 产物并校验 friend）', () => {
            assert.match(source, /module\.exports/);
            assert.match(source, /require\('\.\.\/lib\/xqtime\.js'\)/);
        });
    });

    describe('index.html', () => {
        const html = read('index.html');

        it('链接并内嵌全部三个测试页', () => {
            for (const page of pages) {
                assert.match(html, new RegExp('href="' + page + '"'));
                assert.match(html, new RegExp(page.replace('.', '\\.')));
            }
        });

        it('提示需要通过静态服务器访问', () => {
            assert.match(html, /serve\.mjs/);
        });
    });

    describe('静态服务器 scripts/serve.mjs', () => {
        const source = read('../scripts/serve.mjs');

        it('把 / 重定向到 /test/', () => {
            assert.match(source, /'\/test\/'/);
        });

        it('拒绝路径穿越与 node_modules', () => {
            assert.match(source, /isInsideRoot/);
            assert.match(source, /node_modules/);
        });

        it('no-store 缓存头与正确的 .mjs MIME', () => {
            assert.match(source, /no-store/);
            assert.match(source, /'\.mjs': 'text\/javascript/);
        });
    });
});
