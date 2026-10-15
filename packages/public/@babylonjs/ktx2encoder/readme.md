# KTX2 encoder

Encode RGBA8 pixels as KTX2 textures with Basis Universal v2_50. This experimental package has no Babylon runtime dependency. Babylon's core adapter adds texture readback, workers, and cancellation.

## Encode pixels

```bash
npm install @babylonjs/ktx2encoder
```

```ts
import { KTX2Encoder } from "@babylonjs/ktx2encoder";

const encoder = await KTX2Encoder.CreateAsync({
    jsModuleUrl: "/basisEncoder/v2_50/basis_encoder.js",
    wasmUrl: "/basisEncoder/v2_50/basis_encoder.wasm",
});
const ktx2 = encoder.encode(rgba, width, height, {
    usage: "color",
    generateMipmaps: true,
});
```

Serve the pinned Basis JavaScript and WASM files from your application. In Node or a bundler, pass `basisFactory` and `wasmBinary` instead of URLs. `basisFactory` is the official Basis module factory; `wasmBinary` is an `ArrayBuffer`. No network request is needed when both are injected. You can also pass an already initialized Basis module to `new KTX2Encoder(module)`.

`encode` runs synchronously. Use Babylon's core adapter below to move encoding into workers.

## Choose the usage

The required `usage` option determines the encoding and color metadata:

| Usage | Encoding | Color metadata | Defaults |
| --- | --- | --- | --- |
| `color` | ETC1S with BasisLZ | BT.709 primaries, sRGB transfer | Quality 128, compression level 2 |
| `data` | UASTC LDR 4x4 with Zstandard | Unspecified primaries, linear transfer | Quality level 2 |
| `normal` | UASTC LDR 4x4 with Zstandard | Unspecified primaries, linear transfer | Quality level 2, normal-map mip filtering |

Mipmaps default to enabled. Input pixels are top-down unless `flipY` is true. Alpha detection remains automatic, and output is not marked as premultiplied.

ETC1S accepts `etc1sQualityLevel` from 1 to 255 and `etc1sCompressionLevel` from 0 to 6. UASTC accepts `uastcQualityLevel` from 0 to 4 and `zstandard`. Quality and compression levels are integers. Format-specific options cannot be used with another format.

## Encode a Babylon texture

```ts
import { EncodeTextureToKTX2Async, KhronosTextureContainer2Encoder } from "@babylonjs/core/Misc/khronosTextureContainer2Encoder";

const controller = new AbortController();
const ktx2 = await EncodeTextureToKTX2Async(texture, {
    usage: "normal",
    signal: controller.signal,
});

// Release the default encoder's workers when no more encodes are needed.
KhronosTextureContainer2Encoder.ResetDefault();
```

The adapter waits for loading, reads level zero with `GetTextureDataAsync`, and normalizes row order through Basis's flip option. It does not bake texture UV transforms into the image. GPU readback can convert compressed source pixels; it is not a byte-preserving source-file export.

Readback preserves stored channel values. For sRGB GPU buffers and compressed sRGB formats, it reverses hardware sRGB decoding with the piecewise sRGB transfer function before encoding.

Mipmaps follow the source texture unless you set `generateMipmaps`. Usage is never inferred from `gammaSpace`.

For self-hosted resources, create an encoder and pass it as the third argument:

```ts
const encoder = new KhronosTextureContainer2Encoder({
    jsEncoderModuleUrl: "/babylon.ktx2Encoder.js",
    basisJsUrl: "/basisEncoder/v2_50/basis_encoder.js",
    basisWasmUrl: "/basisEncoder/v2_50/basis_encoder.wasm",
    numWorkers: 1,
});

try {
    const ktx2 = await EncodeTextureToKTX2Async(texture, { usage: "data" }, encoder);
} finally {
    encoder.dispose();
}
```

The core adapter loads the encoder UMD bundle by URL; it does not statically import this package. The bundle exposes `KTX2ENCODER.KTX2Encoder`.

An encoder owns a lazy pool of one or two workers by default. Each worker starts with approximately 128 MiB of WASM memory. `wasmBinary` skips the WASM download. `numWorkers: 0`, or an environment without `Worker`, uses the calling thread.

`encoder.encodeAsync(rgba, width, height, options)` also accepts pixels directly. Worker encoding transfers and detaches the entire input `ArrayBuffer`, including when `rgba` is a subarray. Do not reuse that buffer. Texture encoding transfers only its new readback buffer.

Aborting removes queued jobs or terminates active workers. A later job lazily creates a replacement worker. Readiness and readback waits also settle on abort or encoder disposal. Main-thread jobs run one at a time and yield between encodes, so pending jobs can be cancelled. Synchronous Basis compression cannot be interrupted once it starts.

## Limits

Both dimensions must be positive multiples of 4. The pinned single-threaded wasm32 build supports at most 12,582,912 pixels; 4096 by 4096 exceeds that limit. Images are not resized automatically.

The texture adapter accepts only 2D unsigned byte textures with straight alpha. Cube, 3D, array, floating-point, and premultiplied-alpha textures are rejected before readback. Compressed textures must belong to a scene because their GPU readback uses the scene's post-process manager.

HDR, threaded WASM, progress reporting, and glTF export are not included.
