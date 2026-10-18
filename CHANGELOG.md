# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.1-beta.0] - 2026-10-18

### Changed

- npm publishing now uses trusted publishing (OIDC) from GitHub Actions instead of a long-lived access token; the release workflow runs on Node 24 with a current npm. Follows npm v12 security defaults and the 2FA-bypass token deprecation. No functional changes to the CLI.

## [0.7.0] - 2026-10-18

### Changed

- `runQuery` calls the CrUX REST API directly with `fetch` instead of going through the `googleapis` client. Parameters and the returned data shape are unchanged; failed requests throw an `Error` with the API's `error.message` plus `params` (request query params, never containing the key) and `errors` (the API's error details) attached for consumers that log them.
- Removed the `googleapis` dependency. Installs are now far smaller and the library runs in standards-only runtimes such as Cloudflare Workers.

## [0.6.0] - 2026-10-13

### Added

- `--experimental` flag to include the experimental Core Web Vitals variants that cover soft navigations reported by SPA sites, alongside the stable metrics for easy comparison. Also available programmatically via `params.experimental`. Applies to standard and `--history` queries alike; in raw history JSON, periods without data appear as `"NaN"` densities and `null` p75s.
- Support for the experimental soft-navigation metrics, opt-in via `--experimental` or `--metrics`:
  - `CLS-SN` (experimental Cumulative Layout Shift with softnavs)
  - `LCP-SN` (experimental Largest Contentful Paint with softnavs)
  - `INP-SN` (experimental Interaction to Next Paint with softnavs)
  - They use the same good/average/poor thresholds as their stable counterparts and do not affect the `minimalGood` ranking, which stays based on stable Core Web Vitals.
- Support for the experimental ad metrics, opt-in via `--metrics`: `AD-COUNT`, `AD-DENSITY`, `AD-CPU`, `AD-KB` (p75 only, no published thresholds).

### Changed

- Dependency updates: `googleapis` ^182 → ^185, `nock` ^14 → ^15, and dev tooling (`eslint`, `eslint-plugin-prettier`, `globals`).

## [0.5.0] - 2026-09-29

### Added

- `--metrics` flag to select which metrics to request. Accepts CrUX API metric names or short abbreviations (e.g. `CLS`, `LCP-TTFB`, `NAV_TYPES`). Default remains `CLS,FCP,LCP,TTFB,INP,RTT`, so existing invocations behave as before.
- Support for additional CrUX metrics, opt-in via `--metrics`:
  - `NAV_TYPES` (Navigation Types) — fraction of navigations per type
  - `LCP-RES` (LCP Resource Type) — image vs text content
  - LCP subpart metrics: `LCP-TTFB`, `LCP-LD`, `LCP-LDur`, `LCP-RD` (p75 only, no official good/average/poor thresholds)
- `FORM_FACTORS` metric (fraction of users per device), returned when querying with `--formFactor ALL_FORM_FACTORS`.
- `--periods` flag to set the number of collection periods (1–40, default 25) for `--history` queries.

### Changed

- Fraction-based metrics (`NAV_TYPES`, `FORM_FACTORS`, `LCP-RES`) are reported as `fractions` instead of p75/histogram data, with no good/average/poor ranking.
- Invalid option combinations now exit with a clear error message instead of a stack trace.
- npm publishing: versions with a prerelease suffix (e.g. `0.5.0-beta`) are published under the `beta` dist-tag instead of `latest`.
- Dependency updates: `googleapis` ^174 → ^182, `jest` ^30.4.2 → ^30.5.2, and dev tooling (`eslint` ^10.8 → ^10.11, `globals` ^17.9 → ^17.12, `nock` ^14.0.16 → ^14.0.17).
