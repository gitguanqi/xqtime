/**
 * xqtime 类型声明。
 *
 * 默认导出与命名导出是同一个函数，因此下面两种写法都成立：
 *
 * ```ts
 * import xqtime from 'xqtime';          // xqtime.friend(...)
 * import { friend } from 'xqtime';      // friend(...)
 * ```
 */

/** `friend()` 接受的入参：Date、毫秒时间戳、时间字符串，或省略（当前时间）。 */
export type TimeInput = Date | number | string;

/** 相对时间函数。 */
export interface Friend {
    /**
     * 把时间转成「刚刚 / 12分钟前 / 3天前」这类友好文案。
     *
     * @param time 目标时间，省略则使用当前时间。
     * @param append 为真时在括号内附带具体时间，如 `3天前(10-19)`。
     * @throws {TypeError} 入参不是 Date、有限数字或可解析字符串时抛出。
     */
    (time?: TimeInput, append?: boolean): string;
}

/** 包对象形状。 */
export interface XqTime {
    friend: Friend;
}

/** 具名导出的相对时间函数，与 `xqtime.friend` 是同一个函数。 */
export declare const friend: Friend;

declare const xqtime: XqTime;

export default xqtime;
