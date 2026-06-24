# 12 — Batch-runner manual-render port

Date: 2026-06-24
Branch: `khr-interactivity-importer-v2`
File: `packages/dev/loaders/test/integration/khrInteractivityBatch.test.ts` (dev-only)

## What changed
Replaced the per-asset and InterGlb run phases (`engine.runRenderLoop()` + `await setTimeout`) with a
shared `runSceneFrames(page, durationMs)` helper that drives `scene.render()` manually each ~16ms
(creating a default camera if the asset has none).

## Why
Headless Chrome throttles requestAnimationFrame to ~0fps once a `page.evaluate` awaits, so
`engine.runRenderLoop` advanced the scene only ~1 frame (measured: 1 tick / 10s). Timer-driven flow
nodes — `flow/setDelay.done`, whose `AdvancedTimer` ticks on `scene.onBeforeRenderObservable` — never
fired, so any asset whose verdict is gated behind a setDelay stayed vacuously "ok" (no ERROR logged ≠
actually passed). Manually rendering advances `onBeforeRenderObservable`, so delayed verdicts (and any
ERROR! logs) actually run.

## Result (full batch, correct bundle)
105 ok / 12 FAIL / 0 SILENT / 2 SKIP (was 109 ok / 10 FAIL vacuously).
- The 10 pre-existing math precision/unimplemented fails remain (OkLCh×2, combine4x4, matDecompose,
  slerp, normalize, transform, inverse, quatFromUpForward, get_set_morphtargets).
- 2 SKIP = the two largest pointer assets that crash the headless renderer on load (environmental).
- math/random is ok (the earlier "fail" was a STALE bundle — see below).
- **2 genuinely new results surfaced** (previously vacuous):
  1. `event/send_and_receive` — FAIL. "Default Event Value (Int/Bool/Float): Value is **(empty)**,
     should be 1/false/1". The "Rcv Parameter" subtests (explicit values) PASS. **Likely a REAL
     importer/runtime bug**: event-data DEFAULT values are not applied when an event is received
     without that data. Worth a dedicated fix/investigation.
  2. `flow/setDelay_and_cancelDelay` — FAIL. "Flow [done] in correct delay: Value is 0, should be 1".
     **Harness artifact, NOT a real bug.** The asset measures elapsed time via onTick's
     `timeSinceStart`, which accumulates `engine.getDeltaTime()` (flowGraphSceneEventCoordinator.ts:90,98).
     Under manual `scene.render()` (no real rAF frame loop) `getDeltaTime()` returns ~0, so onTick time
     never advances. setDelay.done itself fires correctly (it is `Date.now()`-based). In a real app
     with `runRenderLoop`, deltaTime advances normally.

## Known limitation of the manual-render technique
`Date.now()`-based timers (flow/setDelay) advance correctly, but `engine.getDeltaTime()`-based values
(onTick `deltaTime` / `timeSinceStart`) do NOT advance under manual rendering. Only time-MEASURING
assets are affected (currently just `flow/setDelay_and_cancelDelay`); event-ref/cancellation/sequence
assets are unaffected.

## IMPORTANT: stale-bundle gotcha discovered
While diagnosing, math/random appeared to fail (A==B, freshness defeated). Root cause: the served
`babylon.js` UMD was STALE — an earlier in-session diagnostic revert of
`flowGraphSignalConnection.pure.ts` (increment-after-execute) had been compiled into the UMD, and the
restore (increment-before) was not rebuilt by the watch. The committed source was correct the whole
time. Fix: `npm run build:dev:fast -w babylonjs` then re-verify the served bundle. After rebuild,
math/random passed (A=0.145, B=0.699). Lesson: after toggling core source during a session, verify the
served UMD reflects the final source before trusting integration results
(`Invoke-WebRequest http://localhost:1337/babylon.js` and check the `_increaseExecutionId()` ordering).

## Follow-ups
- Investigate/fix `event/send_and_receive` default event-data values (likely real).
- `flow/setDelay_and_cancelDelay` needs a real frame loop to verify its timing subtest; it cannot be
  measured under the manual-render harness. Consider documenting as an expected harness skip.
