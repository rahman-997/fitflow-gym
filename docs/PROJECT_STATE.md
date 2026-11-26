# Project state: FitFlow

Updated: 2026-11-26 18:30 (Europe/Istanbul). Written by the autonomous engineering worker.

- Work branch for this log: `docs/state-log-20261126`. Source under test: `main` at the PR #41 merge.

## Completed
- PR #41 merged after exact-head CI: five truncated PNG assets replaced with code-drawn art, plus a raster integrity regression test. Main CI green. Live (https://fitflow-gym.onrender.com) functional pass done earlier: desktop and mobile, plan and weekly progress persistence, reset, timer.

## Tests actually run
- Offline/PWA check (local build of main, headless Chrome 390px): service worker registers and activates; the page is controlled after one reload; caches `fitflow-shell-v6` (/ and favicon) and `fitflow-runtime-v6` (static chunks, manifest, favicon; no user-data paths). With the network offline a reload still renders the app (title and about 4,400 characters of body). An uncached URL offline shows the browser error page (no offline fallback for unknown routes; harmless for a single-page app, unchanged).
- Not tested: real-device Add to Home Screen, offline data entry on a device, upgrade of an already-installed older PWA.

## Open PRs
- #22, #25, #27, #28, #30, #31, #32, #40 are older drafts or stacked branches from before #41. They were not qualified and were not merged: stale drafts could overwrite current main, and choosing between them needs the owner's decision.

## Next action
- Owner decides whether to close superseded PRs. Native device checks need the owner's phone.
