# USDA corpus — provenance & attribution

A deliberately small, pinned slice of authoritative USD assets used by the USDA-only
loader smoke harness (`usdCorpusSmoke.test.ts`). It exercises the product promise —
single-layer USDA text for the `UsdPreviewSurface` / polygonal-mesh profile — end to end,
and classifies in-profile vs. intentionally out-of-profile input.

This is **not** a conformance corpus. Keep it minimal and fast; do not wholesale-copy
upstream corpora. All fixtures are read from disk by the harness; no network access
occurs during tests.

## Upstream sources (pinned)

Every file below was copied from an immutable upstream commit. Re-pin (bump the SHA and
re-copy) intentionally; never point the harness at a moving `main`.

| Key | Repository | Pinned commit | Repo license |
| --- | ---------- | ------------- | ------------ |
| AOUSD | [aousd/core-spec-supplemental-public](https://github.com/aousd/core-spec-supplemental-public) | `1a4adb266a370f49ceedd2ce30442c2e7f457864` | Apache-2.0 |
| USD-WG | [usd-wg/assets](https://github.com/usd-wg/assets) | `1b91f3c464891af259d51d9ee9ee9e6c357f7079` | Apache-2.0 |

Fetched 2026-07-27.

## Per-file provenance

Paths are relative to this directory. "Upstream path" is relative to the pinned repo root.

| File | Source | Upstream path | Asset copyright / license |
| ---- | ------ | ------------- | ------------------------- |
| `parser/simple.usda` | AOUSD | `releases/1.0.1/file_formats/tests/assets/text/usda/simple.usda` | Apache-2.0 (AOUSD) |
| `parser/simple.json` | AOUSD | `releases/1.0.1/file_formats/tests/assets/text/baseline/simple.json` | Apache-2.0 (AOUSD) — golden parse oracle for `simple.usda` |
| `geometry/triangles.usda` | USD-WG | `test_assets/schemaTests/usdGeom/meshes/triangled_mesh/triangles.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |
| `geometry/mixed.usda` | USD-WG | `test_assets/schemaTests/usdGeom/meshes/mixed_faceVertexCounts/mixed.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |
| `geometry/subdiv_none.usda` | USD-WG | `test_assets/schemaTests/usdGeom/meshes/subdiv_none/subdiv_none.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |
| `transforms/simple_transform.usda` | USD-WG | `test_assets/schemaTests/usdGeom/transforms/simple_transform.usda` | Copyright 2022 Apple Inc. (Apache-2.0) — **modified**, see below |
| `transforms/matrix_transform.usda` | USD-WG | `test_assets/schemaTests/usdGeom/transforms/matrix_transform.usda` | Copyright 2022 Apple Inc. (Apache-2.0) — **modified**, see below |
| `materials/TextureCoordinateTest.usda` | USD-WG | `test_assets/TextureCoordinateTest/TextureCoordinateTest.usda` | Copyright 2017-2018 Analytical Graphics, Inc., **CC-BY-4.0**. Mesh and textures by Ed Mackey. |
| `materials/TextureCoordinateTemplate.png` | USD-WG | `test_assets/TextureCoordinateTest/TextureCoordinateTemplate.png` | Copyright 2017-2018 Analytical Graphics, Inc., **CC-BY-4.0** (sidecar for the material above) |
| `scenes/animated_cube_translation.usda` | USD-WG | `test_assets/_common/animated_cube_translation.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |
| `out-of-scope/implicit_sphere.usda` | USD-WG | `test_assets/schemaTests/usdGeom/primitives/sphere.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |
| `out-of-scope/subdiv_catmullClark.usda` | USD-WG | `test_assets/schemaTests/usdGeom/meshes/subdiv_catmullClark/subdiv_catmullClark.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |
| `out-of-scope/materialx_basic.usda` | USD-WG | `test_assets/MaterialXTest/basic.usda` | Copyright 2022 Apple Inc. (Apache-2.0) |

Per-file copyright strings are also preserved verbatim in each fixture's `customLayerData`
/ `customData` where the upstream author recorded them. **Retain them.** `TextureCoordinateTest`
is CC-BY-4.0 (attribution required): the attribution above and the copyright inside the file
satisfy the license.

## Modifications

- `transforms/simple_transform.usda`, `transforms/matrix_transform.usda`: a single
  `over "axis" ( references = @../../../_common/axis.usda@ ) {}` block was removed from each.
  That block referenced an out-of-profile visual axis-gizmo layer and is not part of the
  transform test payload; removing it makes the fixture a self-contained single layer. No
  other content was altered.

No other file was modified from its pinned upstream form.

## Sidecars

- `materials/TextureCoordinateTemplate.png` is the texture referenced by
  `materials/TextureCoordinateTest.usda` (`asset inputs:file = @TextureCoordinateTemplate.png@`)
  and is kept beside it so relative asset-path resolution works.
- `out-of-scope/materialx_basic.usda` references an external `usd_preview_surface_plastic.mtlx`
  MaterialX document that is **intentionally not vendored**: the asset is out of profile, and the
  harness asserts the loader diagnoses/skips it rather than resolving it.
