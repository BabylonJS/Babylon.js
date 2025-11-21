/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as KTX2Decoder from "../../../ktx2Decoder/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).KTX2DECODER = KTX2Decoder;
}

export * from "../../../ktx2Decoder/src/index";
