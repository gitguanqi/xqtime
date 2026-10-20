#!/usr/bin/env node
/**
 * 从唯一源码 src/xqtime.js 生成全部交付产物。
 *
 * 产物：
 *   lib/xqtime.js            UMD 可读    -> main / require() / <script> / AMD / CMD
 *   lib/xqtime.min.js        UMD 压缩    -> CDN / unpkg / jsdelivr
 *   lib/xqtime-esm.mjs       ESM 可读    -> exports.import
 *   lib/xqtime-esm.min.mjs   ESM 压缩
 *   lib/xqtime-esm.js        ESM 可读    -> 旧文件名（字节副本，保住已宣传的路径）
 *   lib/xqtime-esm.min.js    ESM 压缩    -> 旧文件名（字节副本）
 *
 * 用法：
 *   node scripts/build.mjs            生成并写入 lib/
 *   node scripts/build.mjs --check    只比对不写入；有漂移时退出码 1
 *
 * 说明：
 * - esbuild 没有 umd 格式，UMD 由本脚本用 iife 产物包一层前导/收尾生成。
 * - banner 里的版本号从 package.json 读取，不在任何源码里手写，避免版本漂移。
 * - 比对前统一换行符，避免 core.autocrlf 造成的假漂移。
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'src', 'xqtime.js');
const OUT_DIR = path.join(ROOT, 'lib');
const PKG = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const REPO_URL = String(PKG.repository && PKG.repository.url ? PKG.repository.url : '')
    .replace(/^git\+/, '')
    .replace(/\.git$/, '');

const BANNER = `/*
* name: 时间友好化显示（xqtime）
* version: ${PKG.version}
* entry: xqtime.friend(time, append)
* license: ${PKG.license}
* github: ${REPO_URL}
*/
`;

// UMD 前导：CJS / AMD / CMD / 浏览器全局四条分支。
// 全局对象用 globalThis -> self -> this 链，避免被当作 ES 模块加载时 this 为 undefined。
// AMD 分支用标准的 define(factory)，不在注册时立即求值。
const UMD_HEAD = `(function (root, factory) {
    if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof define === 'function' && define.cmd) {
        define(function (require, exports, module) { module.exports = factory(); });
    } else {
        root.xqtime = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
`;

// iife 的 globalName 得到的是"入口 exports 命名空间"，默认导出在 .default 上；
// `|| __xqtime__` 兼容 esbuild 未来把它展平的情况。
const UMD_TAIL = `
    return __xqtime__.default || __xqtime__;
});
`;

const GLOBAL_NAME = '__xqtime__';

function options(format, minify) {
    const config = {
        entryPoints: [SOURCE],
        bundle: true,
        format,
        target: 'es2015',
        charset: 'utf8',
        minify,
        legalComments: 'none',
        write: false,
        logLevel: 'silent',
    };
    if (format === 'iife') config.globalName = GLOBAL_NAME;
    return config;
}

async function bundle(format, minify) {
    const result = await esbuild.build(options(format, minify));
    return result.outputFiles[0].text.trim();
}

function toUmd(iifeText) {
    return UMD_HEAD + iifeText + UMD_TAIL;
}

async function generate() {
    const esm = await bundle('esm', false);
    const esmMin = await bundle('esm', true);
    const iife = await bundle('iife', false);
    const iifeMin = await bundle('iife', true);

    const esmFile = BANNER + esm + '\n';
    const esmMinFile = BANNER + esmMin + '\n';

    return {
        'xqtime.js': BANNER + toUmd(iife) + '\n',
        'xqtime.min.js': BANNER + toUmd(iifeMin) + '\n',
        'xqtime-esm.mjs': esmFile,
        'xqtime-esm.min.mjs': esmMinFile,
        // 旧文件名：字节副本，自包含（不做 shim），避免多一次 .mjs 请求与 MIME 风险
        'xqtime-esm.js': esmFile,
        'xqtime-esm.min.js': esmMinFile,
    };
}

const normalize = (text) => text.replace(/\r\n/g, '\n').trim();

async function main() {
    const check = process.argv.includes('--check');

    if (!check) mkdirSync(OUT_DIR, { recursive: true });

    let outputs;
    try {
        outputs = await generate();
    } catch (error) {
        console.error('[build] 生成失败：' + (error && error.message ? error.message : error));
        return 2;
    }

    let drift = false;
    for (const [name, content] of Object.entries(outputs)) {
        const target = path.join(OUT_DIR, name);
        const expected = normalize(content);
        let current = '';
        try {
            current = readFileSync(target, 'utf8');
        } catch {
            current = null;
        }
        const same = current !== null && normalize(current) === expected;
        if (!same) drift = true;

        const status = same ? 'in sync' : (current === null ? 'MISSING' : 'STALE  ');
        console.log(`${status}  lib/${name}`);

        if (!check) writeFileSync(target, expected + '\n', 'utf8');
    }

    if (check) {
        console.log(drift
            ? '[build] 提交的产物与源码不一致，请运行 `npm run build`。'
            : '[build] 提交的产物与源码一致。');
        return drift ? 1 : 0;
    }

    console.log(`[build] 已生成 ${Object.keys(outputs).length} 个产物（version ${PKG.version}）。`);
    return 0;
}

// 顶层 await 在 Node 14.8+ 可用；用 then 保持与 engines 声明一致。
main().then((code) => {
    process.exitCode = code;
});
