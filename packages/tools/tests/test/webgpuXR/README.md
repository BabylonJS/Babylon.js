# WebGPU-XR local harness

A desktop-Chrome harness that drives the **real** Babylon WebGPU XR render path through a mock
`XRGPUBinding` / `XRSession` / `XRFrame` / `XRProjectionLayer`, and judges the result by **pixel readback**
rather than by eye.

It exists because WebGPU XR bugs are otherwise only reproducible inside a headset, where each experiment
costs a device trip and yields a single bit of information. This harness turns that into a sub-minute local
loop with an objective oracle.

**Not currently run in CI** — see [CI](#ci). Run it by hand while working on the WebGPU XR path.

## Running

```bash
npm run test:webgpu-xr                                # build + run + assert
```

or directly:

```bash
node packages/tools/tests/test/webgpuXR/build.mjs     # bundle core straight from src/
node packages/tools/tests/test/webgpuXR/run.mjs       # run headless, read back pixels, judge
```

`run.mjs` takes an optional JSON config, e.g.:

```bash
node run.mjs '{"frameBudget":20,"deviceTelemetry":true}'
EXPECT_REPRO=1 node run.mjs '{"frameBudget":8,"forceLayer0":true}'  # negative control: must go RED
node sweep.mjs                                          # the fidelity sweep across mock variants
node stacks.mjs                                         # name the call site of any zero-draw render pass
```

Environment: `CHANNEL=chrome` to use an installed Chrome instead of Playwright's bundled Chromium,
`HEADED=1` to watch it, `CHROME_ARGS=...` to pass browser flags, `TRACE=0,1` to dump the render-pass
table for those frames, `FRAME_BUDGET=n` to cap the frame count (CI uses 6).

### Browser requirements

Playwright's **bundled Chromium is sufficient** — no Chrome channel install needed. It exposes
WebGPU on a `localhost` page; a probe against `about:blank` reports no `navigator.gpu` because that
is an opaque origin, which is an easy way to conclude wrongly that bundled Chromium cannot do WebGPU.

No GPU is required either: with `CHROME_ARGS="--use-angle=swiftshader --enable-features=Vulkan"` the
run uses the SwiftShader software adapter, which is what a CI agent gets. Verified on SwiftShader:
the suite passes 40/40 frames on both eyes, and with the Phase-3 clear fix reverted it fails 39/40 —
the same signature as the headset (1/60).

## CI

**This harness is not wired into CI today.** Wiring it into the agent-local _Interaction tests_ job was
attempted and reverted; the work is tracked in
[#18765](https://github.com/BabylonJS/Babylon.js/issues/18765).

The blocker is not WebGPU availability. On the ADO Linux agent the adapter comes up
(`google/swiftshader`), the engine initialises, and the first frame renders in ~120ms — and then the
**renderer process crashes**. Trimming the frame budget, extending the timeout to 15 minutes, and
`--disable-dev-shm-usage` all failed to help, because the failure is a crash rather than a timeout.

So the honest status is: **it reproduces the regression reliably when run by hand, and it does not
guard the branch automatically.**

Everything needed to wire it up later is already in place, and the runner is built to be diagnosable
from a CI log rather than requiring a local repro:

- `WEBGPU-XR: RAN - WebGPU adapter = <vendor>/<arch>` — it really executed
- `WEBGPU-XR: SKIPPED - <reason>` — it did not, and why
- `WEBGPU-XR: phase=<phase> (+<ms>)` — where the time went
- a tab crash is reported explicitly instead of surfacing as an opaque `Target crashed`

Knobs: `FRAME_BUDGET`, `STEP_TIMEOUT_MS`, `HARNESS_WAIT_MS`, `ADAPTER_TIMEOUT_MS`, `ALLOW_NO_WEBGPU`.
Every stage is time-boxed: `requestAdapter()` is specified to return a promise that may never settle,
and unbounded it once wedged a CI job for 15 minutes.

Locally, missing WebGPU is a hard failure (`ALLOW_NO_WEBGPU` unset), so the harness cannot silently
no-op on a dev machine and report a meaningless green.

## What it asserts

`run.mjs` is a test, not a viewer: **it exits non-zero when geometry is missing.** Per frame, per eye, it
copies the sub-image band back to the CPU and classifies every pixel as **geometry** / **clear colour** /
**void**, then reports `OK` / `OVERWRITE` / `NODRAW` ranked by submit order from the command trace. Any
frame without geometry on either eye, any uncaptured GPU error, and "no frames captured" all fail the run.

A plain `node run.mjs` — no knobs — is the regression test for the WebGPU-XR clear-clobber bug: controllers
connect at frame 1, which builds `UtilityLayerRenderer`'s second `Scene`, which is the bug's trigger.
Verified in all four quadrants:

| tree               | invocation                    | expected                                                 |
| ------------------ | ----------------------------- | -------------------------------------------------------- |
| fixed              | `node run.mjs`                | exit 0, geometry on both eyes every frame                |
| clear fix reverted | `node run.mjs`                | **exit 1**, 1/N frames — the device signature            |
| clear fix reverted | `EXPECT_REPRO=1 node run.mjs` | exit 0 (the control fired)                               |
| fixed              | `EXPECT_REPRO=1 node run.mjs` | **exit 1** (a control that cannot fire is not a control) |

`EXPECT_REPRO=1` inverts the assertion, for negative controls (`forceLayer0`) and for confirming a
suspected bug still reproduces before you fix it. Keep a negative control in the loop so a green result is
known to mean something.

## Fidelity rules — the reason this harness works

A mock that is merely _plausible_ is worse than no mock: it produces confident green results for bugs it
cannot see. Every rule below was learned from a real miss, and each is enforced by default.

### 1. The device LIES about queried capabilities. So does this mock.

`stubQueriedUsage: "colorOnly"` is **on by default**: `GPUTexture.usage` on the projection-layer colour
texture reports `0`, while depth reports its real value. That is exactly what the Quest browser does — its
Blink stub returns `0` even though the real usage is non-zero.

Any code that _derives_ a value from a queried capability therefore breaks **here** instead of on the
headset. That has caught a real defect that computed a throwaway texture's usage as `real.usage | TEXTURE_BINDING`:
on device that evaluated to `TEXTURE_BINDING` alone, with no `RENDER_ATTACHMENT`, invalidating every render
encoder and dropping the whole frame. The harness reproduces the Dawn error text verbatim.

> **Rule: never derive a GPU usage from a queried usage. Use explicit constants.**

Treat every _other_ queried capability as potentially stubbed too. If new code reads one, add a mock mode
that lies about it.

### 2. The compositor texture is a rotating pool of 2-layer texture arrays

`poolDepth: 3`, `arrayLayers: 2`, per-eye routing via `baseArrayLayer` in `getViewDescriptor()`. Texture
identity cycles every frame. Desktop Chromium has no pool (one persistent texture); the Quest browser is a
fork that does. A single-texture mock cannot see pool-recycling bugs.

### 3. Both documented Chrome present paths are modelled

`uaCopyMode: "direct"` is Chrome's DirectCopy (`copyTextureToTexture` into a mailbox) — taken on Quest,
where the canvas preferred format matches the backend format. `"render"` is RenderCopy (a shader blit) —
taken on desktop. In both the oracle reads back the **mailbox**, i.e. what the compositor actually
presents, not what we hoped we wrote. `mailboxFreshPerFrame` models `ProduceTexture()` building a new
`GPUTexture` each frame.

### 4. Input sources connect a frame or two in, like a real headset

`inputSourcesAtFrame: 1`. This is not cosmetic. Reporting input sources is what makes Babylon lazily build
`UtilityLayerRenderer.DefaultUtilityLayer` — a **second `Scene`** that renders through the same XR rig
cameras. A mock with `inputSources = []` only ever exercises the single-scene path.

That gap hid a real bug for an entire investigation: the WebGPU per-eye clear observer re-cleared both eyes
_after_ they had been drawn, because every `Scene.render` resets `RenderTargetTexture._cleared` and the
observer guarded on that flag. The scene rendered for exactly one frame and then presented clear colour
forever. With input sources modelled, the harness reproduces it on frame 1 with no special configuration.

### 5. Known fork quirks are emulated

`compositorDepthClearValue: 0.0` (the fork clears app depth to `0` rather than the spec-mandated `1.0`),
`compositorClearsTexture`, and `texture_queried_` semantics that are never reset per frame.

## Layout

| file                  | role                                                                 |
| --------------------- | -------------------------------------------------------------------- |
| `build.mjs`           | esbuild bundle of core, straight from `packages/dev/*/src`           |
| `entry.ts`            | bundle entry point                                                   |
| `run.mjs`             | Playwright runner, pixel oracle, submit-ordered pass analyzer        |
| `sweep.mjs`           | fidelity sweep across mock variants                                  |
| `stacks.mjs`          | captures and dedupes the call site of any zero-draw render pass      |
| `public/harness.html` | the scene, XR entry, and per-frame readback                          |
| `public/mock-xr.js`   | the mock WebXR + `XRGPUBinding` stack (all fidelity rules live here) |
| `public/gpu-trace.js` | zero-engine-change GPU command tracer                                |
