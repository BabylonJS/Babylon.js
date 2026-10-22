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

Configure `JSModule`, `WasmBinary`, `JSModuleURL`, and `WasmModuleURL` before constructing an encoder. Each instance captures those settings and initializes lazily once. Injected resources take precedence over URLs. Each call releases its native encoder; the standalone instance has no `dispose` method.

## Encode a Babylon texture

Also install `@babylonjs/core` for the texture adapter.

```js
import { EncodeTextureToKTX2Async } from "@babylonjs/core/Misc/khronosTextureContainer2Encoder.js";

const ktx2 = await EncodeTextureToKTX2Async(texture, { usage: "normal" });
```

## Limits

Both dimensions must be multiples of 4 from 4 through 16,384, with at most 12,582,912 pixels. Pixels are not resized. The texture adapter accepts 2D unsigned-byte textures with straight alpha; compressed textures require a scene.

Each worker starts with about 128 MiB of WASM memory. Main-thread compression is synchronous. HDR, threaded WASM, progress reporting, and glTF export are not included.

The official Basis v2_50 factory requires CSP `'unsafe-eval'` for Embind.

## Packaged codec

As in the KTX2 decoder package, `wasm/` contains the codec's JavaScript and WASM assets. The encoder also includes the upstream license files. Its `wasm/package.json` sets `"type": "commonjs"` so Node can import the unmodified Basis factory from the surrounding ES-module package. It is package metadata, not a separate npm package or workspace.
