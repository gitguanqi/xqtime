/**
 * AMD 入口模块：由 test/amd.html 通过 RequireJS 加载。
 *
 * 守卫：只在真正的 AMD 环境（define.amd 存在）里注册，
 * 避免被普通 <script> 或 node --test 当作裸脚本执行时抛 ReferenceError。
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('amd', ['../lib/xqtime'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // CommonJS 环境下冒烟：require 库并校验 friend 可调用
        var xqtime = require('../lib/xqtime.js');
        if (typeof xqtime.friend !== 'function') {
            throw new TypeError('xqtime: CommonJS 冒烟失败，friend 不是函数');
        }
        module.exports = xqtime;
    } else {
        root.xqtimeAmdSmoke = false; // 非 AMD 环境不做任何事
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (xqtime) {
    'use strict';

    if (typeof xqtime !== 'object' || typeof xqtime.friend !== 'function') {
        throw new TypeError('xqtime: AMD 加载失败，未拿到 friend 函数');
    }
    return xqtime;
});
