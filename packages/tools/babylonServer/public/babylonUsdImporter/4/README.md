# OpenUSD WebAssembly runtime

These generated runtime artifacts are built from the
[`BabylonJS/babylon-usd-importer`](https://github.com/BabylonJS/babylon-usd-importer)
reference implementation at commit
[`5ce7f96`](https://github.com/SergioRZMasson/babylon-usd-importer/commit/5ce7f96962eff179a56ac57a9856fb4894774331).

Protocol version 4 preserves independent `UsdPreviewSurface` metallic,
roughness, occlusion, opacity, normal, base-color, and emissive texture
bindings. Texture records also preserve the selected output channel,
`sourceColorSpace`, `scale`, and `bias`. Skeleton joint records preserve
separate local rest and bind matrices. Static and single-frame
`UsdGeomPointInstancer` data is grouped by prototype into GPU thin-instance
matrix buffers.

The C++ extractor, Emscripten configuration, authoritative worker source, and
reproducible build instructions are maintained in that repository rather than
duplicated in Babylon.js.

## SHA-256

```text
caaf962049c25a16ed15745508d1dd547580e36edf36f7a9ebc0f27759de2dc5  babylon-usd-importer.worker.js
ccd71ba966d27b1b08aa540915cb983ece00262b440f519d94c2505e2b88c120  babylon-usd-importer.js
c67c1fea3200947a909f4d1d11318037215c2e39ebf4e8a671bfe109a34b9f60  babylon-usd-importer.wasm
ededef6a1ecbc5aa112ffa0f4e2713a13bca316ae005b3d95b91fd8dad240225  babylon-usd-importer.data
```

## License note

The `openusd.license` file is OpenUSD's complete bundled third-party notice. Its
RapidJSON section includes the JSON License for RapidJSON's optional
`bin/jsonchecker` test utility. That utility is not installed by the vcpkg
package and is not compiled or linked into these runtime artifacts. The
RapidJSON code used by OpenUSD is MIT-licensed.
