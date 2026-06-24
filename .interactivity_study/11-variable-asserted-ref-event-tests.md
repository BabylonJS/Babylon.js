# 11 — Variable-asserted ref/event coverage (refs, stopPropagation, InterGlb)

Date: 2026-06-24
Branch: `khr-interactivity-importer-v2`
New dev-only test: `packages/dev/loaders/test/integration/khrInteractivityRefEvents.test.ts`

## Goal
Robustly verify the three user-priority behaviors with **automated assertions** (not fragile
console-string scraping): the ref system (`event/refs`), event cancellation
(`event/stopPropagation`), and cross-GLB events (`InterGlb/RefEcho`).

## Why the batch runner was insufficient
The batch runner scrapes `BJS - … Test Successful` / `ERROR!` console lines. But these assets report
their verdict ONLY through graph variables (`TestResult_HasPassed_*`), so the scraper sees nothing —
`stopPropagation` was only ever checked by hand (`KHR_DUMP_VARS`) and `InterGlb` read 0/0 (vacuous).

## The robust mechanism (descriptor-driven)
Each Khronos asset ships a companion `test-Json/<name>.json`. Per sub-test it gives:
- `successResultVarId` — index of the boolean `TestResult_HasPassed_*` flag (always true on pass),
- `resultVarId` — index of the raw `TestResult_*` value,
- `expectedResultValue` — expected raw value.
Babylon stores interactivity variables under `staticVariable_<index>` (parser `getVariableName`,
interactivityGraphParser.ts:616-635), readable via `context.userVariables`. The GLB `variables` array
index == that `<index>` (verified by decoding refs/stopPropagation/InterGlb). So the harness loads the
descriptor, runs the scene, and asserts every `staticVariable_<successResultVarId> === true` plus a
cross-check `staticVariable_<resultVarId> === expectedResultValue`.

## Two harness bugs found and fixed (NOT product bugs)
While building the harness, two browser-harness issues masked the (correct) runtime:

1. **Load + run in one `page.evaluate` broke delay-gated receivers.** Loading the GLB and starting the
   render loop in the SAME evaluate left `event/receive` un-delivered (refs `receive` subtest read
   false even though the batch logged it passing). Fix: load in one evaluate, run+poll in a separate
   evaluate (matching the batch runner's structure). This restored `event/refs` to 5/5.

2. **Headless rAF throttling stalled `flow/setDelay.done`.** `engine.runRenderLoop` (requestAnimationFrame)
   fires only ~1 frame once the evaluate awaits in headless Chrome (measured: **1 tick / 10s**). The
   `AdvancedTimer` behind `flow/setDelay.done` advances on `scene.onBeforeRenderObservable`, so the
   timer never reached its threshold and delay-gated verdicts (`stopPropagation`, `InterGlb`) never
   completed. Fix: **manually call `scene.render()` each poll iteration** (after ensuring a default
   camera). Ticks went 1 → ~35/s and the verdicts complete in ~1s.

   NOTE: this is the same root cause behind the long-standing "setDelay-gated eval doesn't complete in
   harness window" observation. The batch runner uses `runRenderLoop` + `await setTimeout`, so its
   "ok" status for setDelay-gated assets is effectively vacuous. Porting the manual-render technique to
   the batch runner is a worthwhile follow-up (out of scope here).

## Result — all three pass on the asset's own verdict variables
- `event/refs` — 5/5: onStart/onTick/receive `event` ref non-null; two onStart / two onTick nodes equal ref.
- `event/stopPropagation` — Receiver A received = true; Receiver B NOT triggered (count = 0, HasPassed = true).
- `InterGlb/RefEcho` — File A: echoed ref equals original = true, engine ref forwarded via File B = true;
  File B: received and echoed ref to File A = true.

Confirms the importer + runtime (event refs, stopPropagation cancellation, cross-GLB public ref-typed
events) are correct. The earlier failures were purely test-harness artifacts.

## Notes
- Dev-only (kept out of the final PR), header-flagged. Needs a local asset checkout + babylon-server :1337.
- Single-graph `onStart -> send -> receive` and `setDelay`-gated send were also reproduced and pass in
  the source unit harness (proving the importer path), then those temporary repros were removed.
