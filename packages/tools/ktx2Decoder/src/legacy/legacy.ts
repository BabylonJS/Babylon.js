/* eslint-disable import/no-internal-modules */
import { KTX2Decoder } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).KTX2DECODER = KTX2Decoder;
}

export * from "../index";
