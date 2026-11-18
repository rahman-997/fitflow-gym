# 2026-11-18 — Next.js dependency security update (fitflow-gym)

## Scope
Branch: `fix/fitflow-next-security-1645-20261118`
Base: `fix/pwa-cache-privacy-20261118`
Security patch: Next.js `16.4.3` -> `16.4.5`, matched `eslint-config-next` and related React/Tailwind/types versions from an existing trusted Dependabot lock tree.

## Provenance / safety
Copied matched manifest and lockfile from the repository's own existing Dependabot npm-maintenance branch.
- Updated `package.json` and `package-lock.json` as a consistent pair.
- Added `tests/dependency-lock-integrity.test.mjs` with Node built-in tests to prevent manifest/lock drift or accidental downgrade.
- GitHub round-trip static inspection confirmed root package identity, direct dependencies, Next version, and SHA-512 integrity strings.

## Verified and remaining
- **Verified:** 445 package-lock package entries; no declared direct-dependency version mismatches; Next 16.4.5 is present.
- **Not yet executed:** full project `npm ci`, committed `node --test tests/dependency-lock-integrity.test.mjs`, lint, TypeScript, build, Playwright, npm audit on this new branch. No CI was triggered.
- **Known unresolved:** `picomatch` v2.3.2 and v4.0.7 still appear in the lockfile. GHSA-fc5q-39xc-vjpf remains subject to upstream mitigation; a passing metadata test is **not** a clean vulnerability audit.
- **Policy:** do not ignore npm audit failures, claim a secure production release, merge or deploy until full QA and security review. No paid actions or billable APIs used.

## Free local verification
```bash
npm ci --no-fund --no-audit
node --test tests/dependency-lock-integrity.test.mjs
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=high
```

## Verified transitive advisory scope — 2026-11-18

A fresh read of **this exact branch's** `package-lock.json` confirmed both affected `picomatch` copies are marked `dev: true`:

| Lockfile package | Version | Parent | Lock metadata |
| --- | --- | --- | --- |
| `node_modules/picomatch` | 2.3.2 | `micromatch@4.0.8` (`^2.3.1`) | `dev: true` |
| `node_modules/tinyglobby/node_modules/picomatch` | 4.0.7 | `tinyglobby@0.2.17` (`^4.0.4`) | `dev: true` |

The direct dependencies remain Next.js 16.4.5, React 19.3.1, and React DOM 19.3.1. This lockfile classification suggests a **development/build-time dependency exposure**, but does **not** by itself prove the bundled application, its supply chain, or build pipeline is secure.

Official advisory [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) / [OSV record](https://osv.dev/vulnerability/GHSA-fc5q-39xc-vjpf), last reviewed 2026-11-18: high-severity ReDoS in affected picomatch versions; no verified patched npm version was available in the checked advisory. **Do not apply blind npm overrides, install unaudited forks, hide audit findings, or weaken the blocking `npm audit --audit-level=high` check.** Reassess when upstream releases a verified fix, then run full installation, tests, build, and security audit. No Actions run, merge, deployment, purchases, or production data access performed.

## Follow-up: audit CI fail-closed remediation

- Confirmed a real `.github/workflows/ci.yml` bug: the prior audit step explicitly returned exit status 0 on registry outage, timeout or transient connection errors despite incomplete security validation.
- Replaced it with a single **blocking** `timeout 120s npm run audit` command. This preserves nonzero exit codes; timeout returns 124. No vulnerability scanner is bypassed.
- Added committed security-workflow regression assertions in `tests/dependency-lock-integrity.test.mjs`, and configured the CI quality job to execute `npm run test:dependency-lock`.
- Executed **7/7 committed regression test bodies** against the actual source in isolated V8 with Node module adapters. This is not a full Node/native CI run.
- A separate local shell simulation of the CI audit command returned the expected exit statuses on clean audit (0), vulnerability (1), outage (1), and timeout (124): **4/4 passed**.
- GitHub advisory `GHSA-fc5q-39xc-vjpf` remained high severity with no patched version advertised (official GitHub Advisory last updated 2026-11-17). Both `picomatch` lock entries remain affected and are marked `dev: true`.
- **Not yet verified:** full `npm ci`, native lint/typecheck/build, live audit, browser E2E or CI on this stacked Draft branch. Do not merge, deploy or approve for sale.

## 2026-11-18 — FitFlow PWA installation privacy regression (real Node execution)

**Confirmed vulnerability path:** The prior Service Worker `install` handler directly called `cache.addAll(['/', '/favicon.svg'])`, bypassing the guarded `cacheResponse` routine. An authenticated installation could therefore cache a response without testing `Cache-Control: private/no-store` or `Set-Cookie`.

**Test-first remediation:** Two new native Node `node --test` regressions were executed against a local source snapshot whose original Git blob SHA matched the GitHub branch exactly (`4528b1bb3b595716dfa06ceb9c28059a10623703`). The result was **3 passed / 2 failed (expected red)**. After replacing `addAll` with credential-free `fetch(new Request(..., {credentials:'omit',cache:'no-store'}))` and using `cacheResponse`, all five passed.

**Existing unsafe caches:** A sixth test detected that reusing the `v4` cache namespace retains preexisting entries. Rotated `fitflow-shell-v4` and `fitflow-runtime-v4` to `v5`, leveraging the existing activation filter to delete v4 only and preserve unrelated cache namespaces. Before the cache-version fix: **5 passed / 1 failed**. After: **6/6 passed**, plus `node --check public/sw.js` succeeded.

**Exact source parity:** Local tested snapshots were byte-for-byte verified against the current GitHub blob SHAs:
- `public/sw.js`: `655831b139df0e84f2fae4a5362f7f643b1094af`
- `tests/sw-cache-privacy.test.mjs`: `88e8323409746ad385690982dec2104f6e9dcc5e`

This test run uses **actual Node v22.16.0** and the built-in VM test harness, not simulated test callbacks. The full repository `npm ci`, Next.js build, browser acceptance, and live `npm audit` are still **not executed** on this stacked Draft branch. The independent picomatch ReDoS advisory is not resolved; no audit suppression, PR merge, deployment, or paid GitHub Actions run was performed.

## 2026-11-18 continuation — no-cache and navigation response privacy

- Continued the committed v5 Service Worker regression suite using the local exact Git blob snapshot (`public/sw.js` `655831b1`, tests `88e83234`).
- Found that `Cache-Control: no-cache` responses were still written to offline caches, allowing replay without mandatory revalidation. Also, runtime navigation HTML could be cached even if it was specific to a session but had no explicit private/cookie headers.
- Added **two new native Node regressions** before patching (test commit `4ccb2bd`). **Red: 6/8 pass, 2/8 fail.**
- Fixed `cacheResponse` to reject `no-cache`, and changed `networkFirstNavigation` to never cache live navigation HTML. Offline fallback continues to use the public, credential-free pre-cache produced during `install` (fix commit `28d6dce`).
- **Green: 8/8 tests passed using native Node.js v22.16.0**, `node --check public/sw.js` passed. Compared local Git blob SHAs to GitHub readbacks: `public/sw.js = 3f0ce0fd2cfffd0dea76a7667d6645b4e6cda160`, `tests/sw-cache-privacy.test.mjs = dfa3c15739bf730fe1e3c734726860c330182a98`.
- This is only the Service Worker subsystem. **No full-repo npm installation, Next.js production build, browser E2E, real npm security audit or Actions run** for this stacked branch. The unresolved `picomatch` advisory remains a blocker. No publication/merge/paid usage.

## Follow-up: response metadata privacy and public offline HTML (v3)

The existing FitFlow v5 Service Worker still cached response bodies when a static-looking path returned `Vary: Cookie`/`Vary: Authorization`/`Vary: *`, a `Content-Disposition` attachment or a mismatched HTML fallback. The response pathname alone is not proof of public cacheability.

**Test-first validation, real Node v22.16.0:** added two regression tests covering these response metadata cases (commit `02ca633`). Baseline with the new tests: **8 pass / 2 fail** as expected. Hardened `cacheResponse()` (commit `77a7588`); initial **10/10 pass**.

**Important secondary regression:** because ordinary public home documents use `Content-Type: text/html`, a blanket HTML rejection would break the previously hardened offline install shell. Added another test (commit `bd8962e`) that failed as expected: **10 pass / 1 fail**. Adjusted the HTML guard (commit `c74f233`) to allow **only** the public home (`/`) fetched during the Service Worker install with `credentials: omit`, after checking `Cache-Control`, `Set-Cookie`, `Vary`, and `Content-Disposition`. Other HTML responses are not cached.

**Final verified result:** native `node --test tests/sw-cache-privacy.test.mjs` **11/11 pass**, `node --check public/sw.js` passes. GitHub readback and tested local source match exactly by Git blob SHA:
- `public/sw.js`: `4abdf1713a21f8a5a0648ca9189371a0af8b52dc`
- `tests/sw-cache-privacy.test.mjs`: `40551c8772b5deaad9e2618d2be0e3434b05d5c8`

**Scope:** Service Worker only. No full Next.js build, browser offline E2E, live dependency audit, CI run, merge or deployment was executed. The project remains **NO-GO** until all release gates and the unresolved `picomatch` advisory are handled.

## Follow-up: v6 privacy-cache invalidation — native 12-test gate

The latest response guards changed cache policy after older `fitflow-shell-v5` and `fitflow-runtime-v5` entries may already have persisted responses. Without cache namespace migration those entries could remain available offline even after the source-level fix.

- Regression added **before fix**: a new native Node test requires activation to delete both v5 names, while retaining new v6 and unrelated cache namespaces (commit `13919f1`). **RED: 11/12 tests passed, 1 expected failure** on the old v5 implementation.
- Fixed Service Worker cache names to `fitflow-shell-v6` and `fitflow-runtime-v6`, using the existing activation filter to remove prior v4 and v5 entries (commit `2b6f1a5`).
- **GREEN:** actual Node v22.16.0 `node --test tests/sw-cache-privacy.test.mjs` reports **12/12 passed**, 0 failed; `node --check public/sw.js` passed.
- Byte-level verification against GitHub after committing: `public/sw.js` Git blob `f2bbd70558a841bad92fdefa5e3dea6ee9562095`; `tests/sw-cache-privacy.test.mjs` blob `1a59a0b27c7bd6ab732a38d25b3582968980f4f1`. The local native Node source and tests have identical Git blob hashes.
- All tests validate isolated Service Worker behavior only, **not a browser's real CacheStorage/WebView, a Next.js production build, npm audit, or a full repo E2E run**. Do not merge or deploy; known upstream dependency security blockers remain unresolved.
