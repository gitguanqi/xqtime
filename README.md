# xqtime

Friendly, human-readable time labels — `刚刚` / `12分钟前` / `3天前` / `2年前` — from a `Date`,
a timestamp, or a date string. Zero dependencies, one function.

[中文文档](./zh.md)

## Install

**Browser (global build, UMD)**

```html
<script src="https://unpkg.com/xqtime/lib/xqtime.min.js"></script>
<script>
  xqtime.friend(Date.now() - 86400000); // "1天前"
</script>
```

**Browser (ES module)**

```html
<script type="module">
  import xqtime from 'https://unpkg.com/xqtime/lib/xqtime-esm.min.mjs';
  console.log(xqtime.friend(Date.now() - 3600000)); // "1小时前"
</script>
```

**Node / bundlers**

```sh
npm install xqtime
```

```js
const xqtime = require('xqtime');          // CommonJS
```

```js
import xqtime, { friend } from 'xqtime';   // ESM (default and named export are the same function)
```

AMD and CMD are supported by the same UMD build.

## Usage

`friend(time, append)` returns a relative-time string.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `time` | `Date` \| `number` \| `string` | now | Target time. A number is a millisecond timestamp. A string accepts `YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`, `YYYY-MM-DDTHH:mm:ss`, or anything `Date.parse` understands. |
| `append` | `boolean` | `false` | When true, the concrete time is appended in parentheses: `3天前(10-19)`. |

### Input formats

```js
xqtime.friend('2012-04-12 10:03:15'); // date string, parsed in local time
xqtime.friend('2012-04-12');          // date only → local midnight (not UTC)
xqtime.friend(1365780195000);         // millisecond timestamp
xqtime.friend(new Date());            // Date object
xqtime.friend();                      // omitted → current time
```

### Examples

Every example below computes the time from `Date.now()`, so the outputs stay correct over time.

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

With `append = true`:

```js
xqtime.friend(new Date(), true);              // '刚刚(14:05:32)'
xqtime.friend(Date.now() - 2 * DAY, true);    // '2天前(10-19)'
xqtime.friend(Date.now() - 2 * YEAR, true);   // '2年前(2024-10-21)'
```

The appended format depends on the level: `HH:mm:ss` for under an hour, `MM-DD` for days and
months, `YYYY-MM-DD` for a year and older. Years are always zero-padded to four digits, so a
960 AD date renders as `0960-11-12`.

## Thresholds and boundaries

| Time difference | Output | Appended time |
| --- | --- | --- |
| `< 60s` | `刚刚` | `HH:mm:ss` |
| `< 1h` | `N分钟前` | `HH:mm:ss` |
| `< 1d` | `N小时前` | `HH:mm:ss` |
| `< 30d` | `N天前` | `MM-DD` |
| `< 365d` | `N月前` | `MM-DD` |
| `< 100y` | `N年前` | `YYYY-MM-DD` |
| `< 1000y` | `N世纪前` | `YYYY-MM-DD` |
| `< 10000y` | `N千年前` | `YYYY-MM-DD` |
| `>= 10000y` | `N万年前` | `YYYY-MM-DD` |

Notes on the contract:

- A month is 30 days and a year is 365 days. No calendar arithmetic is performed, so the level
  is a pure duration comparison — this keeps the function cheap and timezone-free.
- Boundaries are exclusive: exactly `60000ms` is `1分钟前`, `59999ms` is `刚刚`.
- A future time is reported as `刚刚` rather than a negative value.
- A `Date` or parsed date string cannot reach the `亿年前` level. A finite numeric timestamp
  outside the `Date` range can reach it, but `append = true` may not have a valid calendar value.

## Invalid input

Values other than `Date`, a finite number, a parsable string, or `undefined` throw a `TypeError`
instead of returning a broken string:

```js
xqtime.friend('not-a-date'); // TypeError: xqtime: 无法解析的时间字符串 "not-a-date"
xqtime.friend(null);         // TypeError: xqtime: 不支持的时间类型 [object Null]
xqtime.friend('2021-02-30'); // TypeError: xqtime: 时间字符串的月日时分秒超出有效范围
```

> Before 0.2.0 these inputs silently produced `NaNundefined`. If you relied on that, wrap the
> call or validate the input first.

## AI agent metadata

[llms.txt](./llms.txt) is the compact API contract for agent integrations.

## Development

```sh
npm install
npm test              # build drift check + unit tests + artifact contract tests
npm run build         # regenerate lib/ from src/xqtime.js
npm run test:browser  # zero-dependency static server for test/*.html
```

`lib/` is generated — edit `src/xqtime.js` and rebuild. `npm test` fails if the committed
bundles drift from the source.

## License

MIT · [@gitguanqi](https://github.com/gitguanqi) · [submit an issue](https://github.com/gitguanqi/xqtime/issues/new)
