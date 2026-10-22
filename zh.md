# xqtime

把时间转成「刚刚 / 12分钟前 / 3天前 / 2年前」这类友好文案。零依赖，只有一个函数。

[English documents](./README.md)

## 安装

**浏览器（全局构建，UMD）**

```html
<script src="https://unpkg.com/xqtime/lib/xqtime.min.js"></script>
<script>
  xqtime.friend(Date.now() - 86400000); // "1天前"
</script>
```

**浏览器（ES 模块）**

```html
<script type="module">
  import xqtime from 'https://unpkg.com/xqtime/lib/xqtime-esm.min.mjs';
  console.log(xqtime.friend(Date.now() - 3600000)); // "1小时前"
</script>
```

产物语法级别为 ES2015+（不是 ES5）。

**Node / 打包工具**

```sh
npm install xqtime
```

```js
const xqtime = require('xqtime');          // CommonJS
```

```js
import xqtime, { friend } from 'xqtime';   // ESM，默认导出与命名导出是同一个函数
```

同一份 UMD 产物同时支持 AMD 与 CMD。

## 使用

`friend(time, append)` 返回相对时间文案。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `time` | `Date` \| `number` \| `string` | 当前时间 | 目标时间。数字为毫秒时间戳；字符串支持 `YYYY-MM-DD`、`YYYY-MM-DD HH:mm:ss`、`YYYY-MM-DDTHH:mm:ss`，其余交给 `Date.parse`。 |
| `append` | `boolean` | `false` | 为真时在括号内附带具体时间，如 `3天前(10-19)`。 |

### 支持的格式

```js
xqtime.friend('2012-04-12 10:03:15'); // 时间字符串，按本地时区解析
xqtime.friend('2012-04-12');          // 只有日期 → 本地零点（不是 UTC 零点）
xqtime.friend(1365780195000);         // 毫秒时间戳
xqtime.friend(new Date());            // Date 对象
xqtime.friend();                      // 省略入参 → 当前时间
```

### 使用案例

下面所有示例都用 `Date.now()` 推算时间，因此输出不会随时间推移而失真。

```js
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

xqtime.friend(Date.now() - 30 * SECOND);      // '刚刚'
xqtime.friend(Date.now() - 12 * MINUTE);      // '12分钟前'
xqtime.friend(Date.now() - 3 * HOUR);         // '3小时前'
xqtime.friend(Date.now() - 2 * DAY);          // '2天前'
xqtime.friend(Date.now() - 3 * 30 * DAY);     // '3月前'
xqtime.friend(Date.now() - 2 * YEAR);         // '2年前'
xqtime.friend(Date.now() - 150 * YEAR);       // '1世纪前'
```

`append = true`：

```js
xqtime.friend(new Date(), true);              // '刚刚(14:05:32)'
xqtime.friend(Date.now() - 2 * DAY, true);    // '2天前(10-19)'
xqtime.friend(Date.now() - 2 * YEAR, true);   // '2年前(2024-10-21)'
```

附带格式随档位变化：一小时以内为 `HH:mm:ss`，天与月为 `MM-DD`，一年及更早为
`YYYY-MM-DD`。年份固定补足 4 位，因此公元 960 年显示为 `0960-11-12`。

## 阈值与边界

| 时间差 | 文案 | 附带时间 |
| --- | --- | --- |
| `< 60 秒` | `刚刚` | `HH:mm:ss` |
| `< 1 小时` | `N分钟前` | `HH:mm:ss` |
| `< 1 天` | `N小时前` | `HH:mm:ss` |
| `< 30 天` | `N天前` | `MM-DD` |
| `< 365 天` | `N月前` | `MM-DD` |
| `< 100 年` | `N年前` | `YYYY-MM-DD` |
| `< 1000 年` | `N世纪前` | `YYYY-MM-DD` |
| `< 1 万年` | `N千年前` | `YYYY-MM-DD` |
| `>= 1 万年` | `N万年前` | `YYYY-MM-DD` |

契约要点：

- 1 月按 30 天、1 年按 365 天计算，不做日历运算，档位只取决于时长，因此函数开销很小且不受时区影响。
- 边界为左闭右开：恰好 `60000ms` 才是 `1分钟前`，`59999ms` 仍是 `刚刚`。
- 未来时间统一显示为 `刚刚`，不会出现负数。
- `Date` 或解析后的日期字符串无法触达 `亿年前` 档位；超出 `Date` 范围的有限数字时间戳可以触达，但 `append = true` 时括号内的具体时间不一定有效。

## 非法入参

除 `Date`、有限数字、可解析字符串与 `undefined` 之外，其余入参一律抛 `TypeError`，不再返回坏字符串：

```js
xqtime.friend('not-a-date'); // TypeError: xqtime: 无法解析的时间字符串 "not-a-date"
xqtime.friend(null);         // TypeError: xqtime: 不支持的时间类型 [object Null]
xqtime.friend('2021-02-30'); // TypeError: xqtime: 时间字符串的月日时分秒超出有效范围
```

> 0.2.0 之前这些入参会静默返回 `NaNundefined`。如果你的代码依赖了这个行为，请先做入参校验。

## AI 代理元数据

[llms.txt](./llms.txt) 提供供 AI 代理直接读取的精简 API 契约。

## 开发

```sh
npm install
npm test              # 产物漂移检查 + 单元测试 + 产物契约测试
npm run build         # 从 src/xqtime.js 重新生成 lib/
npm run test:browser  # 启动零依赖静态服务器，打开 test/*.html
```

`lib/` 是生成目录，请改 `src/xqtime.js` 后重新构建；源码与提交产物不一致时 `npm test` 会失败。

## 许可证

MIT · [@gitguanqi](https://github.com/gitguanqi) · [提交问题](https://github.com/gitguanqi/xqtime/issues/new)
