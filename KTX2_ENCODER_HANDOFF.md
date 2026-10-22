# KTX2 encoder handoff

Feature work is paused at the user's request. The encoder is implemented, pushed, and awaiting public API and packaging review. Do not merge, publish, deploy, or enable auto-merge without new authorization.

## State on October 22, 2026

The branch is `ktx2-encoder`. The code commit before this handoff is `a4bd7e756131f5efb27eb60a729dc61c7d2ef3b1`. The worktree was clean before creating this document.

| Pull request                                                                         | State       | Head before this handoff                   |
| ------------------------------------------------------------------------------------ | ----------- | ------------------------------------------ |
| [BabylonJS/Babylon.js#19011](https://github.com/BabylonJS/Babylon.js/pull/19011)     | Open, draft | `a4bd7e756131f5efb27eb60a729dc61c7d2ef3b1` |
| [alexchuber/Babylon.js#96](https://github.com/alexchuber/Babylon.js/pull/96)         | Open, draft | `a4bd7e756131f5efb27eb60a729dc61c7d2ef3b1` |
| [BabylonJS/Documentation#1649](https://github.com/BabylonJS/Documentation/pull/1649) | Open, draft | `35f5f1a0221bdf10f05b3d07a262f4c4f1c63d52` |
| [alexchuber/Documentation#2](https://github.com/alexchuber/Documentation/pull/2)     | Open, draft | `35f5f1a0221bdf10f05b3d07a262f4c4f1c63d52` |

[Monorepo CI build 61248](https://dev.azure.com/babylonjs/ContinousIntegration/_build/results?buildId=61248) is green for the pre-handoff code. This includes Windows Node 22/24, Linux Node 22, unit tests, WebGL2/WebGPU visualization, build, lint/format, TypeDoc, ES6, interaction, memory, and performance jobs. Unselected workflows are neutral. This is not a result for the subsequent handoff commit; refresh checks when resuming.

## Implementation and public API

There are two layers. Neither changes the original KTX2 decoder.

| Layer                                        | Implementation                                                  | Public package or entry                                            |
| -------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Standalone RGBA8 encoder                     | `packages/tools/ktx2Encoder/src/ktx2Encoder.ts`                 | `@babylonjs/ktx2encoder`, `babylonjs-ktx2encoder`                  |
| Babylon texture adapter and worker ownership | `packages/dev/core/src/Misc/khronosTextureContainer2Encoder.ts` | Core `EncodeTextureToKTX2Async`, `KhronosTextureContainer2Encoder` |

Standalone usage is decoder-style:

```ts
const encoder = new KTX2Encoder();
const bytes = await encoder.encode(rgba, width, height, { usage: "color" });
```

`encode` accepts `Uint8Array`, width, height, and `IKTX2EncoderOptions`, returning `Promise<Uint8Array>`. Explicit usage is `"color"`, `"data"`, or `"normal"`. Color uses ETC1S/sRGB; data and normal use UASTC/Zstandard/linear.

Configure these static settings before construction:

```ts
KTX2Encoder.JSModule; // Injected Basis factory, default null.
KTX2Encoder.WasmBinary; // Injected ArrayBuffer, default null.
KTX2Encoder.JSModuleURL; // Default CDN Basis JavaScript URL.
KTX2Encoder.WasmModuleURL; // Default CDN Basis WASM URL.
```

The default asset URLs are `https://cdn.babylonjs.com/basisEncoder/v2_50/basis_encoder.js` and the corresponding `basis_encoder.wasm`. Each constructor snapshots the settings; the first valid encode initializes lazily. Injected resources override URLs. A failed initialization remains failed for that instance.

The standalone instance has no `dispose()` method. Each encode deletes its native Basis encoder. `_initializeAsync` is internal, not a public warmup API. The earlier `CreateAsync` configuration API was removed before release, without compatibility aliases.

The core adapter exposes `encodeAsync(rgba, width, height, options)` and `EncodeTextureToKTX2Async(texture, options, encoder?)`. Configuration remains `jsEncoderModuleUrl`, `basisJsUrl`, `basisWasmUrl`, `wasmBinary`, and `numWorkers`. It owns lazy workers, cancellation, idle release, and disposal. Call `dispose()` on owned adapters; `ResetDefault()` disposes the shared default.

The adapter temporarily applies standalone statics, constructs synchronously, and restores prior values without an asynchronous window. Keep this isolation if changing initialization.

## Package and build wiring

Both new public manifests are version **9.32.0**:

- `packages/public/@babylonjs/ktx2encoder/package.json`
- `packages/public/umd/babylonjs-ktx2encoder/package.json`

The matching two lock entries were updated, without unrelated lock churn. Upstream's public `babylonjs` manifest was 9.32.0 when checked on Thursday, October 22. Recheck the live version before any release decision. Do not bump every package to match this branch.

The release publisher runs `scripts/updateVersion.js` before building/publishing. It discovers named public packages and overwrites their versions from the computed release version. Thus branch manifest versions do not override that publisher's version choice. Do not execute the updater or release scripts in the live checkout as a probe; they mutate many files.

Relevant wiring:

- `packages/tools/ktx2Encoder/package.json` has a build-only `@dev/core` dependency. Its build copies the shared validator/types from core's compiled output.
- Public packages do not require core at runtime. The shared definition originates in `packages/dev/core/src/Materials/Textures/ktx2encoderTypes.ts`.
- ESM build copies the unmodified official Basis pair and legal files into `wasm/`.
- Vendor source assets live in `packages/tools/babylonServer/public/basisEncoder/v2_50/`.
- UMD exports `KTX2ENCODER`; its public build uses `rollup.config.umd.mjs`.
- `packages/dev/buildTools/src/packageMapping.ts` registers bundle discovery.
- `packages/dev/buildTools/src/prepareSnapshot.ts` collects static files with `globSync(..., { nodir: true })`, including extensionless licenses.
- Root workspaces exclude exactly `!packages/public/@babylonjs/ktx2encoder/wasm`.

### Why the nested package metadata stays

Like the decoder, the ESM encoder has a `"type": "module"` package root and classic JavaScript/WASM assets under `wasm/`. The encoder's `wasm/package.json` contains only `"type": "commonjs"`. It lets native Node ESM default-import the unmodified CommonJS Basis factory; it is not a separately published package.

Removing that metadata demonstrably causes a missing-default-export error in Node. The decoder does not provide the same native factory-import guarantee, so blindly copying its absence would regress the encoder. Renaming or wrapping vendor code was not justified. The exact workspace exclusion prevents npm from discovering this metadata as a nameless workspace, while the file still ships in the ESM tarball.

The package README contains the current Node example: import `BASIS` from `@babylonjs/ktx2encoder/wasm/basis_encoder.js`, read the packaged WASM, assign `JSModule` and `WasmBinary`, construct, and await encode.

## Resolved feedback and important commits

| Commit                                     | Change                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `85c1ee4b1edb113eb6eaeae6a81464b28c26ccc7` | Decoder-symmetric constructor/static configuration and async encode API; docs coordinated.             |
| `e5aadd746e8b1007760ba6c61efebd7bdcbbb822` | Build prerequisite, exact nested workspace exclusion, matching lock, package/snapshot probes.          |
| `c4804f77d4dab1fec1e122831c1724308604002a` | Gary's channel, failed-loading readiness, and generic snapshot feedback.                               |
| `c65ac3982d5371b159104043ac194d4c27bb5bee` | Windows-safe npm discovery test, Node factory interop regression, metadata explanation, 9.32.0.        |
| `a4bd7e756131f5efb27eb60a729dc61c7d2ef3b1` | Bounded 60-second timeout for the filesystem snapshot fixture after an observed cold-filesystem delay. |

Gary's four inline comment IDs are `4329810795` (workspace), `4329810805` (channels), `4329810814` (loading error), and `4329887863` (snapshot glob). The coordinator posted replies. Refresh live thread state before replying or resolving anything.

Raw readback now preserves R80 as `[80, 0, 0, 255]` on both GPU backends, while default grayscale previews stay unchanged. Alpha/luminance semantics also have unit coverage. Readiness waits reject on a subsequent image load failure and remove error/load/abort/disposal listeners. Snapshot collection includes `havok/LICENSE` without encoder-specific exceptions.

The Windows CI failure was a test launching `npm` directly. The test now invokes `process.execPath` with `npm_execpath`; its child has an empty PATH to prove it needs no platform launcher. Run these tests through npm/npx.

## Validation and review record

The last implementation pass passed 44 encoder tests and six numerical browser tests. Browser coverage includes real Basis encoding and decoded pixels on WebGL2/WebGPU, workers, lazy CDN loading, compressed sRGB, KTX1 orientation, and a delayed image 404.

Clean tool/ESM/UMD builds passed. Isolated tarballs contained 21 ESM and eight UMD files, including entry points, types, codec assets, and legal payload. Native Node ESM/CommonJS factory imports, real encoding from both package formats, URL-plus-binary initialization, and consumer TypeScript passed without core installed. Actual snapshot payload matched source assets byte-for-byte.

Offline `npm ci --dry-run --ignore-scripts --offline --audit=false --fund=false`, formatting, bounded lint, and normal commit hooks passed. Earlier isolated core/build-tools builds and core-test typechecks passed. An extended browser-test type probe had four unchanged baseline diagnostics; do not describe that ad hoc probe as clean. Older broad local suites had unrelated fixture timeouts, but the later remote build 61248 passed its selected suites.

The last review used the installed plugin at `alexchuber/reviewing/skills/code-review/SKILL.md`, not the repository skill. Its frozen range was:

```text
c4804f77d4dab1fec1e122831c1724308604002a..a4bd7e756131f5efb27eb60a729dc61c7d2ef3b1
```

| Domain          | Result                   |
| --------------- | ------------------------ |
| Standards       | No findings              |
| Spec            | No findings              |
| Simplification  | No findings              |
| Bundle size     | Not applicable           |
| Synchronization | Failed response contract |
| Time complexity | No findings              |
| Memory          | No findings              |
| JavaScript      | Failed response contract |
| Comments        | No findings              |

All initial launches failed before execution because of a provider/model binding. One retry with the same required `gpt-6.1-sol` model recovered execution. Two reviewers still returned an ambiguous generic response after clarification. Usable coverage is **7/9**, with zero accepted findings, not nine green domain reports. Earlier feature/API reviews covered broader changes; this last pass covered only the stated delta.

## Limits and remaining decisions

- Both dimensions must be multiples of four, from 4 through 16,384, with at most 12,582,912 pixels. The texture adapter accepts 2D unsigned-byte, straight-alpha textures. Compressed readback requires a scene.
- Each worker begins with approximately 128 MiB of WASM memory. Worker input buffers are transferred and detached; callers must respect ownership. Batch concurrency retains full pixel buffers.
- Main-thread native compression is synchronous and cannot be interrupted. Cancellation there is cooperative, not preemptive.
- Official Basis v2_50 requires CSP `'unsafe-eval'` for Embind. The last artifact investigation, reported October 21, found no official fixed encoder pair. [BinomialLLC/basis_universal#464](https://github.com/BinomialLLC/basis_universal/issues/464) referenced [BinomialLLC/basis_universal#474](https://github.com/BinomialLLC/basis_universal/pull/474), then open/unmerged with the option off by default and no rebuilt artifacts. Recheck upstream before changing this conclusion or any vendored pair.
- HDR, threaded WASM, progress reporting, and glTF exporter integration are out of scope. Do not rebuild Basis or redesign the accepted API merely for stylistic parity.

Alex still needs to review the public API and packaging. The companion docs PRs contain the finalized API examples and ES6/CDN entries; coordinate source behavior changes with their owner rather than guessing at documentation.

Raanan confirmed that the Thursday/manual publisher automatically publishes brand-new packages. That does not prove first-publish access, npm name ownership, provenance/token policy, or deployment of every new CDN asset. Confirm those separately, including `babylon.ktx2Encoder.js`, versioned Basis JS/WASM, and legal files on required preview/stable/versioned endpoints. Do not run a real publisher to test discovery.

Protected `.github/product-inventory.md` still lacks the encoder. With explicit approval, add the package-map row `KTX2 Encoder | @babylonjs/ktx2encoder | @tools/ktx2encoder | packages/tools/ktx2Encoder` and a runtime-library description. No protected edits were approved or made for this audit.

## Resume checklist and commands

Refresh PR heads, comments, release version, and checks before making changes. Ask Alex which API or packaging concern to iterate on; feature work is deliberately paused. A green CI run is not authorization to merge.

These commands exist in this branch:

```bash
git status --short
gh pr view 19011 -R BabylonJS/Babylon.js --json state,isDraft,headRefOid
gh pr checks 19011 -R BabylonJS/Babylon.js
npx vitest run --project=unit packages/tools/ktx2Encoder/test/unit --maxWorkers=2
npx vitest run --project=unit packages/dev/core/test/unit/Misc/textureTools.test.ts packages/dev/core/test/unit/Misc/khronosTextureContainer2Encoder.test.ts --maxWorkers=2
npx tsc -b packages/dev/core/tsconfig.build.json packages/dev/buildTools/tsconfig.build.json
npm run build -w @tools/ktx2encoder
npm run build -w @babylonjs/ktx2encoder
npm run build -w babylonjs-ktx2encoder
```

After builds, use `npm pack --ignore-scripts --workspace @babylonjs/ktx2encoder --pack-destination <temporary-directory>` and the analogous UMD command for isolated inspection. Never publish as a probe.

For browser checks, first check ports 1337/1338 for other users' servers. Start `npm run serve:no-watch -w @tools/babylon-server`, verify readiness, then run:

```bash
FORCE_CHROME=true npx playwright test --config playwright.config.ts --project=integration packages/tools/tests/test/integration/ktx2Encoder.test.ts --workers=1 --retries=0 --reporter=line
```

For future core behavior changes, also use the devhost `testScene` loop described in `.github/instructions/devhost-testing.instructions.md`. Restore temporary scene edits and stop only servers you started.

## Cleanup and retained context

Before creating this handoff, there were no active shell sessions or background agents, no listeners on validation ports 1337/1338, and no untracked files. Temporary devhost edits were restored byte-for-byte. Generated NGE examples are not part of the final diff.

Keep the durable source and companion docs sessions available. Do not archive this source session or discard useful evidence. Machine-local history/probes are under the source session's `files/` directory, session ID `fc5addf9-d4e2-466b-8aae-ef73001e9790`; coordinator ID `116cabe2-f95a-4d0e-ac0e-104aa1c1b998`; docs owner ID `866d3e6f-d042-45c8-aad8-e7fc52b37003`. Local probes are supporting evidence, not required repository tooling.

Preserve user edits and inspect any new dirt before cleanup. Do not touch the fork's `master`, push upstream branches, edit protected configuration, or post review replies without authorization. Normal commits use repository hooks and the session trailers.
