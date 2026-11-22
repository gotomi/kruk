# Public TypeScript types for kruk 0.8.1 + removing the app shim

> **Status:** proposal, not implemented
> **Date:** 2026-11-22
> **Decision:** option A — hand-written declarations for the public API; no full TypeScript rewrite

## Context

`kruk` 0.8.0 ships raw ESM without type declarations (`main: src/crux.js`, no
`types`, no `exports`). The `crux-compare` app therefore keeps a hand-written
shim at `src/types/kruk.d.ts` (44 lines). The shim is an ambient declaration
(`declare module "kruk"`), so it **shadows** any types shipped by the package —
it must be removed after the package publishes types, otherwise nothing
improves.

The library's public surface is three functions:

- `runQuery(API_KEY, cruxQueryParams, history = false)`
- `buildQueryParams(params, url)`
- `getReports(urls, API_KEY, params, groupByMetric = false)`

The app only uses these three package-entry exports (no deep imports). A full
TypeScript rewrite would take an estimated 4–7 days, mostly tooling: `dist/`,
changing `main`/`bin`, transforming Jest tests (currently `transform: {}`), the
shebang, an `exports` decision, and the risk of breaking deep imports such as
`kruk/src/crux-convert.js`. With 589 lines of source and three public
functions, that cost is disproportionate. Boundary declarations are enough.

**Goal:** publish a non-breaking `0.8.1` with public API types, add a typecheck
to CI, and remove the shim from the app. No runtime changes, no `exports` map.

## Stage 1 — library (`/Users/tomek/work/kruk`)

### 1. `src/crux.d.ts` (new)

Declarations for the public entry only (`src/crux.js`):

- `CruxFormFactor`:
  `"ALL_FORM_FACTORS" | "DESKTOP" | "TABLET" | "PHONE" | (string & {})` —
  permissive so the app's `HistoryRequestParams.formFactor?: string` keeps
  compiling (narrowing to the union alone would require an app change).
- `CruxQueryParams` — input to `buildQueryParams`/`getReports`:
  `formFactor?`, `origin?`, `history?`, `experimental?`, `metrics?`, `periods?`.
- `CruxQueryBody` — `buildQueryParams` output: `metrics: string[]`, optional
  `formFactor`, `origin`, `url`, `collectionPeriodCount`.
- `CruxApiResponse` — raw API response: `record?`,
  `urlNormalizationDetails?`, index signature.
- `CruxRawRecord` / `CruxRawMetric` — raw history records
  (`histogramTimeseries`, `percentilesTimeseries.p75s`, densities
  `number | string | null`).
- `CruxConvertedMetric` — histogram variant (`histogram`, `p75`, `rank`) and
  fractions variant (`fractions`, `p75: null`, `rank: "-"`).
- `CruxSite`, `CruxGroupedMetrics`, `CruxReport`, `CruxGroupedReport`,
  `CruxErrorReport`, `CruxResult`.
- `CruxApiError extends Error` with `params?: CruxQueryBody` and
  `errors?: unknown`. Interface only — `runQuery` still throws a plain `Error`
  with attached fields; the declaration documents the shape for `catch`.
- Signatures:
  - `buildQueryParams(params: CruxQueryParams, url: string): CruxQueryBody`
  - `runQuery(apiKey: string, body: CruxQueryBody, history?: boolean): Promise<CruxApiResponse>`
    with JSDoc `@throws`
  - `getReports(urls: string[], apiKey: string, params: CruxQueryParams, groupByMetric?: boolean): Promise<CruxResult>`
    — a broad union instead of aggressive overloads; JSDoc notes that per-URL
    errors are swallowed and omitted from the result, while history returns raw
    records.

### 2. `package.json`

- `"types": "src/crux.d.ts"` — no `exports` map (deep imports remain
  importable; `types` is enough for `import "kruk"` resolution).
- `"typecheck": "tsc -p tsconfig.types.json"`.
- devDependency `typescript` (latest stable).

### 3. `tsconfig.types.json` (new)

`target: ES2022`, `lib: ["ES2022"]`, `module`/`moduleResolution: NodeNext`,
`strict: true`, `noEmit: true`, `skipLibCheck: true`, `types: []`;
`include`: `src/crux.d.ts`, `test/types.test.ts`.

### 4. `test/types.test.ts` (new)

Compile-time test (not picked up by Jest, whose `testMatch` is `*.test.js`):

- positive use of `buildQueryParams` → `runQuery` → `getReports`,
- narrowing the result union (`Array.isArray` / `"error" in report`),
- `@ts-expect-error` for a bad `formFactor` (e.g. `1`) and a missing `metrics`
  in `CruxQueryBody`.

### 5. CI

- `.github/workflows/npm-publish.yml`: add `npm run typecheck` and `npm test`
  before `npm publish`.
- Optionally (recommended) a new minimal `ci.yml` on `pull_request`/`push` to
  `main`: `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`.

### 6. Documentation

- `CHANGELOG.md`: `0.8.1` entry — "Added TypeScript declarations for the public
  API; no runtime changes".
- `README.md`: a short note under "Programmatic Usage" that the package ships
  types.

### 7. Lockfile and version

- `npm install --save-dev typescript` regenerates `package-lock.json` (the root
  is currently stale: `0.7.1-beta.0`).
- `npm version patch --no-git-tag-version` → `0.8.1` (updates `package.json`
  and the lock).
- Verify `npm ci` after updating the lock.

### 8. Branch, PR, release

- branch `feat/types`
- commit `feat: add TypeScript declarations for the public API`
- PR to `main`
- after a green PR: GitHub release `v0.8.1` (triggers trusted publishing)
- publishing is irreversible — only after `npm pack --dry-run` and green checks

## Stage 2 — app (`/Users/tomek/work/crux-netlify`)

After `kruk@0.8.1` is published:

1. `npm install kruk@^0.8.1` (or `npm update kruk`). The lock holds 0.8.0, so
   without this the types will not be installed.
2. Remove `src/types/kruk.d.ts` (and the empty `src/types/`) — otherwise the
   ambient shim still shadows the package types.
3. Optionally add `typescript` as a devDependency and a
   `"typecheck": "tsc --noEmit"` script — `tsc` is currently only transitive,
   and `vitest`/build do not typecheck.
4. Run `tsc --noEmit`, `npm test`, `npm run check`, `npm run build`.
5. Branch/PR: a small follow-up after #15 is merged is recommended
   (`chore: use kruk's published TypeScript types`). If `0.8.1` is already on
   npm before #15 merges, the bump and shim removal can be added as a commit to
   #15.

## Verification

- kruk: `npm ci`, `npm run typecheck`, `npm test`, `npm pack --dry-run` —
  confirm `src/crux.d.ts` is in the tarball and `package.json.types` points to
  it; optionally `npx @arethetypeswrong/cli --pack .`.
- After publishing: `npm view kruk@0.8.1 version types`,
  `npm view kruk dist-tags` (latest = 0.8.1), `npm pack kruk@0.8.1` +
  `tar -tf` (d.ts present).
- App: `tsc --noEmit` without the shim, tests, Biome, build; `historyApi.ts`
  compiles against the package types.
- E2E with no runtime changes: `POST /api/getCrux` (PHONE, ALL_FORM_FACTORS,
  history + experimental) behaves as before.

## Risks and notes

- `formFactor` stays permissive so `HistoryRequestParams.formFactor?: string`
  keeps working; narrowing to the union would require an app change.
- No `exports` map — deep imports (`kruk/src/crux-convert.js`) remain untyped,
  but nothing stops working.
- The declarations are hand-written; the compile-time test + CI typecheck guard
  against drift. New metrics/exports must update them.
- npm versions cannot be overwritten; check `npm pack` before releasing.
- kruk has no PR CI today; adding `ci.yml` is a small but separate process
  improvement.
- Next step after boundary types (if the library keeps growing): JSDoc +
  `checkJs` + generated declarations, not a full rewrite.

## Estimate

| Option | Cost | When |
| --- | --- | --- |
| A. Hand-written public types (this plan) | ~0.5 day | now |
| B. JSDoc + `checkJs` + generated `.d.ts` | 2–4 days | if we also type the internals |
| C. Full TypeScript rewrite | 4–7 days | only if the library keeps growing |

## References

- App: PR [#15](https://github.com/gotomi/crux-compare/pull/15) contains the
  temporary `src/types/kruk.d.ts` shim; it is removed after `0.8.1` ships.
- Integration audit: `form_factors` must be explicitly listed in `metrics` when
  a metric filter is used; an origin with a path is normalized by the API; the
  History API supports the four soft-navigation metrics. These findings do not
  change the typing plan, but describe the public contract the declarations
  should reflect.
