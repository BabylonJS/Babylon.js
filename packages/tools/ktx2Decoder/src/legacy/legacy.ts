/* eslint-disable @typescript-eslint/no-restricted-imports */

// NOTE: The UMD wrapper (webpack or rollup) already assigns the full namespace
// to globalThis.KTX2DECODER. Manually setting it here to just the KTX2Decoder
// class would overwrite the namespace object that rollup's `extend: true`
// passes into the factory, breaking named exports like LiteTranscoder_UASTC_ASTC.

export * from "../index";
