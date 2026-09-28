# OpenUSD WebAssembly runtime

These generated runtime artifacts are built from the standalone
[`babylon-usd-importer`](https://github.com/SergioRZMasson/babylon-usd-importer)
reference implementation at commit
[`52b69e3ef27f837b0b9525640ac07e4b5d2f51e7`](https://github.com/SergioRZMasson/babylon-usd-importer/commit/52b69e3ef27f837b0b9525640ac07e4b5d2f51e7).

The authoritative worker source is
[`package/src/worker.ts`](https://github.com/SergioRZMasson/babylon-usd-importer/blob/52b69e3ef27f837b0b9525640ac07e4b5d2f51e7/package/src/worker.ts).
`babylon-usd-importer.worker.js` is its TypeScript build output. The C++ extractor,
Emscripten configuration, and reproducible build instructions are maintained in
that repository rather than duplicated in Babylon.js.

## SHA-256

```text
caaf962049c25a16ed15745508d1dd547580e36edf36f7a9ebc0f27759de2dc5  babylon-usd-importer.worker.js
ccd71ba966d27b1b08aa540915cb983ece00262b440f519d94c2505e2b88c120  babylon-usd-importer.js
a747403456dfb21f6442992622d5efbfe59637e68939a472fc01de319be4c3a8  babylon-usd-importer.wasm
ededef6a1ecbc5aa112ffa0f4e2713a13bca316ae005b3d95b91fd8dad240225  babylon-usd-importer.data
```

## License note

The `openusd.license` file is OpenUSD's complete bundled third-party notice. Its
RapidJSON section includes the JSON License for RapidJSON's optional
`bin/jsonchecker` test utility. That utility is not installed by the vcpkg
package and is not compiled or linked into these runtime artifacts. The
RapidJSON code used by OpenUSD is MIT-licensed.
