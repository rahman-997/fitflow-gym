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
