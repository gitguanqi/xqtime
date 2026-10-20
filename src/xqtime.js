/**
 * xqtime —— 时间友好化显示。
 *
 * 这是包内唯一的源码。`lib/` 下的所有产物（UMD / ESM / 压缩版）都由
 * `scripts/build.mjs` 从这里生成，请不要直接编辑 `lib/`。
 */

// 时间单位换算（秒）。月与年是固定长度的近似值，不做日历运算：
// 1 月 = 30 天，1 年 = 365 天。这是公开契约的一部分，见 README「阈值与边界」。
const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH = DAY * 30;
const YEAR = DAY * 365;
const CENTURY = YEAR * 100;
const MILLENNIUM = CENTURY * 10;
const MYRIAD = MILLENNIUM * 10;
const EON = MYRIAD * 10000;

// 阈值表：时间差（秒）小于 THRESHOLDS[i] 时命中第 i 档。
// 档位：0 刚刚 / 1 分钟 / 2 小时 / 3 天 / 4 月 / 5 年 / 6 世纪 / 7 千年 / 8 万年 / 9 亿年。
// 第 9 档在 Date 可表示范围（约 ±27 万年）内不可达，保留以维持档位编号稳定。
const THRESHOLDS = [MINUTE, HOUR, DAY, MONTH, YEAR, CENTURY, MILLENNIUM, MYRIAD, EON];

const LABELS = ['刚刚', '分钟前', '小时前', '天前', '月前', '年前', '世纪前', '千年前', '万年前', '亿年前'];

// 支持 "YYYY-MM-DD"、"YYYY-MM-DD HH:mm:ss"、"YYYY-MM-DDTHH:mm:ss"，月/日/时/分/秒允许省略前导零。
const DATE_TIME_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;

const DATE_TAG = '[object Date]';

function isDate(value) {
    return Object.prototype.toString.call(value) === DATE_TAG;
}

function pad(value) {
    return value < 10 ? '0' + value : String(value);
}

function padTo(value, width) {
    let text = String(value);
    while (text.length < width) text = '0' + text;
    return text;
}

// 年份统一 4 位补零；负年份（公元前）用 "-" 加 6 位补零，Date 可表示到约 -271821 年。
function formatYear(year) {
    return year < 0 ? '-' + padTo(-year, 6) : padTo(year, 4);
}

/**
 * 把时间字符串按「本地时区」解析。
 *
 * 直接交给 `new Date(string)` 有两个坑：只有日期的 "YYYY-MM-DD" 会被规范当成 UTC，
 * 带空格的 "YYYY-MM-DD HH:mm:ss" 在部分浏览器（如旧版 Safari）解析失败。
 * 因此这里先自己拆出年月日时分秒，再用本地分量构造，并校验各分量没有被自动进位。
 */
function parseDateTimeString(text) {
    const matched = DATE_TIME_PATTERN.exec(text);
    if (!matched) {
        const parsed = Date.parse(text);
        if (Number.isNaN(parsed)) {
            throw new TypeError('xqtime: 无法解析的时间字符串 "' + text + '"');
        }
        return parsed;
    }

    const year = Number(matched[1]);
    const month = Number(matched[2]);
    const day = Number(matched[3]);
    const hour = matched[4] === undefined ? 0 : Number(matched[4]);
    const minute = matched[5] === undefined ? 0 : Number(matched[5]);
    const second = matched[6] === undefined ? 0 : Number(matched[6]);

    // 用 setFullYear 而不是 new Date(year, ...)：后者会把 0-99 年映射到 1900+。
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(hour, minute, second, 0);

    const overflow = date.getFullYear() !== year
        || date.getMonth() !== month - 1
        || date.getDate() !== day
        || date.getHours() !== hour
        || date.getMinutes() !== minute
        || date.getSeconds() !== second;

    if (overflow) {
        throw new TypeError('xqtime: 时间字符串的月日时分秒超出有效范围 "' + text + '"');
    }

    return date.getTime();
}

/**
 * 把入参归一化成毫秒时间戳。
 * 白名单：undefined（当前时间）/ Date / 有限数字 / 可解析字符串。其余一律抛 TypeError，
 * 不再像旧版那样静默产出 "NaNundefined"。
 */
function toTimestamp(input) {
    if (input === undefined) return Date.now();

    if (isDate(input)) {
        const value = input.getTime();
        if (!Number.isFinite(value)) {
            throw new TypeError('xqtime: 传入的 Date 无效（getTime() 为 NaN）');
        }
        return value;
    }

    if (typeof input === 'number') {
        if (!Number.isFinite(input)) {
            throw new TypeError('xqtime: 时间戳必须是有限数字，收到 ' + String(input));
        }
        return input;
    }

    if (typeof input === 'string') {
        return parseDateTimeString(input.trim());
    }

    throw new TypeError(
        'xqtime: 不支持的时间类型 ' + Object.prototype.toString.call(input)
        + '，请传入 Date、毫秒时间戳或时间字符串'
    );
}

// 时间差（秒）落在第几档。未来时间（seconds < 0）命中第 0 档，显示「刚刚」。
function levelOf(seconds) {
    for (let index = 0; index < THRESHOLDS.length; index += 1) {
        if (seconds < THRESHOLDS[index]) return index;
    }
    return THRESHOLDS.length;
}

// 附带时间：0-2 档给时分秒，3-4 档给月日，5 档及更早给完整年月日。
function formatAttached(level, timestamp) {
    const date = new Date(timestamp);
    const clock = pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    if (level <= 2) return clock;

    const monthDay = pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    if (level <= 4) return monthDay;

    return formatYear(date.getFullYear()) + '-' + monthDay;
}

/**
 * 把时间转成「刚刚 / 3分钟前 / 2天前」这类友好文本。
 *
 * @param {Date|number|string} [time] 目标时间，省略则用当前时间。
 * @param {boolean} [append] 是否在括号内附带具体时间，默认 false。
 * @returns {string} 友好文本；append 为真时形如 "3天前(10-18)"。
 * @throws {TypeError} 入参不是 Date / 有限数字 / 可解析字符串时。
 */
function formatDateTime(time, append) {
    const timestamp = toTimestamp(time);
    const seconds = (Date.now() - timestamp) / 1000;

    const level = levelOf(seconds);
    const amount = level === 0 ? 0 : Math.floor(seconds / THRESHOLDS[level - 1]);
    const relative = level === 0 ? LABELS[0] : amount + LABELS[level];

    if (!append) return relative;
    return relative + '(' + formatAttached(level, timestamp) + ')';
}

const xqtime = {
    friend: formatDateTime,
};

// 默认导出保持旧形状 `{ friend }`；命名导出是新增的，两者指向同一个函数。
export { formatDateTime as friend };
export default xqtime;
