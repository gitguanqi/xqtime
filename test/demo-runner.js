/**
 * 三个测试页面共用的自检执行器。
 *
 * 这是一份普通的浏览器脚本（不是模块），挂到 window 上供内联脚本调用：
 *   window.xqtimeDemoRun('UMD', window.xqtime.friend)
 *   window.xqtimeDemoRender(window.xqtime.friend)
 *
 * 在 Node 里（例如被 `node --test` 无参发现）会直接返回，不做任何事。
 */
(function () {
    if (typeof window === 'undefined') return;

    var SECOND = 1000;
    var MINUTE = 60 * SECOND;
    var HOUR = 60 * MINUTE;
    var DAY = 24 * HOUR;
    var YEAR = 365 * DAY;

    function pad(value) {
        return value < 10 ? '0' + value : String(value);
    }

    // 取 "3天前(10-19)" 里括号内的部分
    function datePart(result) {
        var open = result.indexOf('(');
        return open === -1 ? '' : result.slice(open + 1, result.length - 1);
    }

    // 2021-10-05 这类固定日期：档位在一百年内都稳定落在「年」档
    var FIXED_OCTOBER = new Date(2021, 9, 5, 10, 3, 15); // 2021-10-05 10:03:15
    var FIXED_JANUARY = new Date(2021, 0, 5, 10, 3, 15); // 2021-01-05 10:03:15

    var CHECKS = [
        {
            name: '导出存在：friend 是函数',
            run: function (friend) { return typeof friend; },
            expected: 'function'
        },
        {
            name: '30 秒前 → 刚刚',
            run: function (friend) { return friend(Date.now() - 30 * SECOND); },
            expected: '刚刚'
        },
        {
            name: '12 分钟前',
            run: function (friend) { return friend(Date.now() - 12 * MINUTE); },
            expected: '12分钟前'
        },
        {
            name: '3 小时前',
            run: function (friend) { return friend(Date.now() - 3 * HOUR); },
            expected: '3小时前'
        },
        {
            name: '2 天前',
            run: function (friend) { return friend(Date.now() - 2 * DAY); },
            expected: '2天前'
        },
        {
            name: '3 个月前（90 天）',
            run: function (friend) { return friend(Date.now() - 90 * DAY); },
            expected: '3月前'
        },
        {
            name: '2 年前',
            run: function (friend) { return friend(Date.now() - 2 * YEAR); },
            expected: '2年前'
        },
        {
            name: '未来时间 → 刚刚',
            run: function (friend) { return friend(Date.now() + DAY); },
            expected: '刚刚'
        },
        {
            name: 'append：一小时以内给 HH:MM:SS',
            run: function (friend) { return /^\d+分钟前\(\d{2}:\d{2}:\d{2}\)$/.test(friend(Date.now() - 12 * MINUTE, true)); },
            expected: true
        },
        {
            name: 'append：日取的是日而不是星期（2021-10-05）',
            run: function (friend) { return datePart(friend(FIXED_OCTOBER, true)); },
            expected: '2021-10-05'
        },
        {
            name: 'append：1 月补零为 01（2021-01-05）',
            run: function (friend) { return datePart(friend(FIXED_JANUARY, true)); },
            expected: '2021-01-05'
        },
        {
            name: 'append：世纪档位带完整日期，不再输出空括号',
            run: function (friend) {
                var date = new Date(Date.now() - 150 * YEAR);
                return /^\d+世纪前\(\d{4}-\d{2}-\d{2}\)$/.test(friend(date, true));
            },
            expected: true
        },
        {
            name: '字符串按本地时区解析',
            run: function (friend) { return datePart(friend('2012-04-12 10:03:15', true)); },
            expected: '2012-04-12'
        },
        {
            name: '非法入参抛 TypeError',
            run: function (friend) {
                try {
                    friend('not-a-date');
                    return '未抛错';
                } catch (error) {
                    return error instanceof TypeError ? 'TypeError' : error.name;
                }
            },
            expected: 'TypeError'
        },
        {
            name: '重复调用结果一致（不污染状态）',
            run: function (friend) {
                var first = friend(Date.now() - 2 * DAY, true);
                var second = friend(Date.now() - 2 * DAY, true);
                return first === second;
            },
            expected: true
        }
    ];

    function renderChecks(results) {
        var list = document.getElementById('checks');
        if (!list) return;
        list.textContent = '';
        results.forEach(function (item) {
            var row = document.createElement('li');
            row.className = 'check ' + (item.ok ? 'is-pass' : 'is-fail');

            var badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = item.ok ? 'PASS' : 'FAIL';

            var name = document.createElement('span');
            name.className = 'check-name';
            name.textContent = item.name;

            var detail = document.createElement('span');
            detail.className = 'check-detail';
            detail.textContent = item.ok
                ? String(item.actual)
                : '期望 ' + String(item.expected) + '，实际 ' + String(item.actual);

            row.appendChild(badge);
            row.appendChild(name);
            row.appendChild(detail);
            list.appendChild(row);
        });
    }

    function updateStatus(label, results) {
        var passed = results.filter(function (item) { return item.ok; }).length;
        var failed = results.length - passed;
        var status = failed === 0 ? 'passed' : 'failed';

        var statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.dataset.status = status;
            statusEl.textContent = (status === 'passed' ? 'PASS' : 'FAIL')
                + ' · ' + label + ' · ' + passed + ' / ' + results.length + ' 通过'
                + (failed ? '（' + failed + ' 项失败）' : '');
        }

        document.documentElement.dataset.demoStatus = status;
        window.__xqtimeDemo = {
            page: label,
            status: status,
            passed: passed,
            total: results.length,
            checks: results
        };
    }

    function run(label, friend) {
        var usable = typeof friend === 'function';
        var results = CHECKS.map(function (check) {
            if (!usable) {
                return { name: check.name, ok: false, expected: check.expected, actual: '未拿到 friend（脚本未加载？）' };
            }
            var actual;
            try {
                actual = check.run(friend);
            } catch (error) {
                return { name: check.name, ok: false, expected: check.expected, actual: error.name + ': ' + error.message };
            }
            return { name: check.name, ok: Object.is(actual, check.expected), expected: check.expected, actual: actual };
        });

        renderChecks(results);
        updateStatus(label, results);
        return results;
    }

    var DEMO_OFFSETS = [
        ['30 秒', 30 * SECOND],
        ['12 分钟', 12 * MINUTE],
        ['3 小时', 3 * HOUR],
        ['2 天', 2 * DAY],
        ['3 个月（90 天）', 90 * DAY],
        ['2 年', 2 * YEAR]
    ];

    function render(friend) {
        var body = document.getElementById('demo-body');
        if (!body) return;
        if (typeof friend !== 'function') {
            body.innerHTML = '<tr><td colspan="3">未拿到 friend，无法渲染演示</td></tr>';
            return;
        }
        body.textContent = '';
        DEMO_OFFSETS.forEach(function (entry) {
            var target = Date.now() - entry[1];
            var row = document.createElement('tr');
            [entry[0], friend(target), friend(target, true)].forEach(function (text) {
                var cell = document.createElement('td');
                cell.textContent = text;
                row.appendChild(cell);
            });
            body.appendChild(row);
        });
    }

    function renderDemo(friend) {
        render(friend);
        var button = document.getElementById('recompute');
        if (button && !button.dataset.bound) {
            button.dataset.bound = '1';
            button.addEventListener('click', function () { render(friend); });
        }
    }

    window.xqtimeDemoRun = run;
    window.xqtimeDemoRender = renderDemo;
    window.xqtimeDemoChecks = CHECKS.length;
})();
