# Babylon.js KTX2 encoder

Encode RGBA8 pixels with Basis Universal v2_50. This experimental API uses ETC1S/sRGB for `color` and UASTC/Zstandard/linear for `data` and `normal`. Compression does not import the Babylon engine; option types are shared with core.

## Installation

```bash
npm install @babylonjs/ktx2encoder @babylonjs/core
```

## Encode pixels in Node

```js
import { readFile } from "node:fs/promises";
import { KTX2Encoder } from "@babylonjs/ktx2encoder";
import BASIS from "@babylonjs/ktx2encoder/wasm/basis_encoder.js";

const wasm = await readFile(new URL(import.meta.resolve("@babylonjs/ktx2encoder/wasm/basis_encoder.wasm")));
const encoder = await KTX2Encoder.CreateAsync({ basisFactory: BASIS, wasmBinary: new Uint8Array(wasm).buffer });
const ktx2 = encoder.encode(rgba, width, height, { usage: "color" });
```

## Encode a Babylon texture

```js
import { EncodeTextureToKTX2Async } from "@babylonjs/core/Misc/khronosTextureContainer2Encoder.js";

const ktx2 = await EncodeTextureToKTX2Async(texture, { usage: "normal" });
```

## Limits

Both dimensions must be positive multiples of 4, with at most 12,582,912 pixels. Pixels are not resized. The texture adapter accepts 2D unsigned-byte textures with straight alpha; compressed textures require a scene.

Each worker starts with about 128 MiB of WASM memory. Main-thread compression is synchronous. HDR, threaded WASM, progress reporting, and glTF export are not included.

The official Basis v2_50 factory requires CSP `'unsafe-eval'` for Embind.
