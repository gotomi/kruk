# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
