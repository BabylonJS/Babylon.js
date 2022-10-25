import * as KTX2Decoder from "@tools/ktx2decoder";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).KTX2DECODER = KTX2Decoder;
}

export * from "@tools/ktx2decoder";
