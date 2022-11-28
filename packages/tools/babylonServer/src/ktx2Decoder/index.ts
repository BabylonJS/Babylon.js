/* eslint-disable import/no-internal-modules */
import * as KTX2Decoder from "../../../ktx2Decoder/src/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).KTX2DECODER = KTX2Decoder;
}

export * from "../../../ktx2Decoder/src/index";
