/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Ktx2Encoder from "../../../ktx2Encoder/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).KTX2ENCODER = Ktx2Encoder;
}

export * from "../../../ktx2Encoder/src/index";
