# 13 — math/rgbToOkLCh & math/rgbFromOkLCh implementation

Date: 2026-06-24
Branch: `khr-interactivity-importer-v2`

## What
Implemented the two color-conversion ops that were failing/unmapped:
- `math/rgbToOkLCh` (r,g,b → l,c,h)
- `math/rgbFromOkLCh` (l,c,h → r,g,b)

## Standard used
Björn Ottosson's Oklab definition (https://bottosson.github.io/posts/oklab/), the same conversion
adopted by **CSS Color Level 4**. Implemented the `linear_srgb_to_oklab` / `oklab_to_linear_srgb`
matrices directly, plus the OkLCh polar form:
- `C = hypot(a, b)`, `h = atan2(b, a)` (**hue in radians**), and `a = C·cos h`, `b = C·sin h`.
- RGB treated as **linear** sRGB (no gamma transfer).

### Why linear (no gamma)
The asset test cases are all gamma-agnostic: red/white/black are sRGB transfer fixed points, achromatic
is grayscale, and the round-trip is self-consistent. So gamma vs linear is invisible to every subtest.
Linear is the simpler canonical core transform and matches glTF's linear-color convention.

## Verified against the assets (decoded)
Conventions confirmed by decoding the GLBs: scalar I/O (r/g/b ↔ l/c/h), hue in radians, tolerances
0.001 (white) / 0.005 (red) / exact (black). My formula vs expected:
- black → L=0, C=0 (exact) ✓
- white → L=1, C=0 (exact) ✓
- red → L=0.62796 (exp 0.628), C=0.25768 (exp 0.2577), H=0.51023 (exp 0.5082; Δ0.002 < 0.005 tol) ✓
- rgbFromOkLCh(red) → r=1.0003, g≈0, b≈0 ✓
- round-trip rgb(0.8,0.3,0.5) → exact ✓

## Implementation
- `flowGraphMathBlocks.pure.ts`: `_RgbToOkLch`/`_OkLchToRgb` helpers + `FlowGraphRGBToOkLChBlock` /
  `FlowGraphRGBFromOkLChBlock` (extend FlowGraphBlock, 3 scalar inputs → 3 scalar outputs), registered
  in `RegisterFlowGraphMathBlocks`.
- `flowGraphBlockNames.ts`: `RGBToOkLCh`, `RGBFromOkLCh`.
- `flowGraphBlockFactory.ts`: two dynamic-import cases.
- `declarationMapper.ts`: explicit input/output socket mappings for `math/rgbToOkLCh` / `math/rgbFromOkLCh`.

## Verification
- New core unit test (flowGraphDataNodes.test.ts) covering red/black/white, inverse, round-trip.
- FlowGraph unit suite 314/314; loaders Interactivity 205/205. Format + ESLint clean; no manifest drift.
- Integration: `math/rgbToOkLCh` and `math/rgbFromOkLCh` both **ok (0 errors)** in the batch runner.

Batch FAIL count: 12 → 10 (the two OkLCh assets now pass).
