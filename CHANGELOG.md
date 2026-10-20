# Changelog

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 0.2.0

### Fixed

- **Appended day was the weekday.** `appendTime` used `getDay()` (0–6, Sunday-based) where the
  day of the month was intended, so every `append` output carried the wrong day — e.g.
  `2021-12-25` rendered as `2021-12-06`.
- **Months 1–10 rendered as `00`–`09`.** The month was zero-padded *before* the `+1` offset, and
  the offset was skipped entirely in the padding branch. `2021-10-05` now renders as
  `2021-10-05` instead of `2021-09-02`.
- **Century-and-older levels produced empty parentheses.** `1世纪前()`, `1千年前()` and
  `10万年前()` now include the full `YYYY-MM-DD` date.
- **Date-only strings were parsed as UTC.** `'2012-04-12'` is now local midnight, matching
  `new Date(2012, 3, 12)`, instead of shifting by the timezone offset.
- **`'YYYY-MM-DD HH:mm:ss'` is parsed explicitly** rather than relying on implementation-defined
  string parsing, which fails on some browsers (notably older Safari).
- **Invalid input no longer returns `NaNundefined`.** Non-`Date`, non-finite-number and
  unparsable-string arguments throw a `TypeError` with an `xqtime:` prefixed message.

### Added

- Named ESM export: `import { friend } from 'xqtime'` (the default export is unchanged).
- `index.d.ts` with overloads for the accepted argument types.
- `exports` map with `import` / `require` / `types` conditions, `unpkg` and `jsdelivr` entries.
  Deep imports such as `xqtime/lib/xqtime.min.js` keep working.
- A single source of truth in `src/xqtime.js` and a build script that regenerates every bundle,
  with `build:check` wired into `npm test` so committed bundles cannot drift from the source.
- Unit tests for thresholds, boundaries, appended formats, string parsing and invalid input;
  artifact tests covering all four bundles plus the UMD `CJS` / `AMD` / `CMD` / global branches.
- Self-checking browser pages with visible `PASS` / `FAIL` results and a zero-dependency
  static server (`npm run test:browser`).

### Changed

- **Breaking:** invalid arguments now throw instead of silently returning a broken string.
  `null` and `boolean` are no longer treated as timestamps (`new Date(null)` was the Unix epoch).
- `main` still points at `lib/xqtime.js`; the ES module build is now `lib/xqtime-esm.mjs`.
  `lib/xqtime-esm.js` remains as a byte-identical copy for existing links.
- Bundles are emitted as ES2015+, not ES5. The source already used `const`, template literals
  and default parameters, so this is not a new limitation.
- The version banner is generated from `package.json` instead of being hand-written, so it can no
  longer disagree with the published version.
- `package.json` no longer ships `test/` to npm (`files` is now explicit), and
  `package-lock.json` is committed for reproducible builds.

## 0.1.0 and earlier

Version numbers were bumped without corresponding source changes after 0.0.7, while the bundles
kept a `0.0.7` banner. No functional changes were made in those bumps.
