# Babylon.js KTX2 encoder

Encode RGBA8 pixels with Basis Universal v2_50. This experimental API uses ETC1S/sRGB for `color` and UASTC/Zstandard/linear for `data` and `normal`. Compression does not import the Babylon engine; option types are shared with core.

## Installation

```bash
npm install @babylonjs/ktx2encoder
```

## Encode pixels in Node

In browsers, `new KTX2Encoder()` uses the default CDN assets on the first awaited `encode` call. For Node, inject the packaged factory and WASM:

```js
import { readFile } from "node:fs/promises";
import { KTX2Encoder } from "@babylonjs/ktx2encoder";
import BASIS from "@babylonjs/ktx2encoder/wasm/basis_encoder.js";

const wasm = await readFile(new URL(import.meta.resolve("@babylonjs/ktx2encoder/wasm/basis_encoder.wasm")));
KTX2Encoder.JSModule = BASIS;
KTX2Encoder.WasmBinary = new Uint8Array(wasm).buffer;
const encoder = new KTX2Encoder();
const ktx2 = await encoder.encode(rgba, width, height, { usage: "color" });
```

Configure `JSModule`, `WasmBinary`, `JSModuleURL`, and `WasmModuleURL` before constructing an encoder. Each instance captures those settings and initializes lazily, sharing concurrent attempts and retrying after initialization failures. Injected resources take precedence over URLs. Each call releases its native encoder; the standalone instance has no `dispose` method.

## Options and defaults

Per-call options are `usage` (required), the codec settings for that usage, `flipY` (default `false`) and `generateMipmaps` (default `true`). Codec settings that do not apply to the usage are ignored. As with the decoder, tuning options are passed to the codec without extra range checks; use the ranges documented by their types. Image dimensions and RGBA byte length are checked before encoding.

`KTX2Encoder.DefaultEncoderOptions` forces `etc1sQualityLevel`, `etc1sCompressionLevel`, `uastcQualityLevel` and `zstandard` for every later call. Like the KTX2 decoder's defaults, defined values override per-call values. They apply only to matching usages: ETC1S settings to `color`, UASTC settings to `data` and `normal`. Set a field to `undefined` to clear it. `usage`, `flipY` and `generateMipmaps` are never defaults.

```js
KTX2Encoder.DefaultEncoderOptions = { etc1sQualityLevel: 200, zstandard: false };
```

## Babylon textures

Core's `KhronosTextureContainer2Encoder` configuration is groundwork for the upcoming glTF exporter, which will be the public entry point for encoding Babylon textures. This release has no public texture-encoding helper and no public worker bootstrap.

The internal adapter accepts 2D unsigned-byte textures and explicitly rejects integer texture formats before readback. On WebGL, it also rejects legacy alpha, luminance, and luminance-alpha formats because they cannot be read as color framebuffer attachments. Injected worker pools are captured per instance and do not replace the shared automatic pool. Automatic workers are replaced after initialization failures or fatal WASM errors; ordinary encode errors and cancellation preserve healthy workers.

## Limits

Both dimensions must be multiples of 4 from 4 through 16,384, with at most 12,582,912 pixels. This cap comes from the Basis v2_50 wasm32 build, so 4096x4096 is unsupported. Pixels are not resized.

Each worker starts with about 128 MiB of WASM memory. Main-thread compression is synchronous. HDR, threaded WASM, progress reporting, and glTF export are not included.

The official Basis v2_50 factory requires CSP `'unsafe-eval'` for Embind (BinomialLLC/basis_universal#464 and #474).

## Packaged codec

As in the KTX2 decoder package, `wasm/` contains the codec's JavaScript and WASM assets. The encoder also includes the upstream license files. Its `wasm/package.json` sets `"type": "commonjs"` so Node can import the unmodified Basis factory from the surrounding ES-module package. It is package metadata, not a separate npm package or workspace.
