/* eslint-disable @typescript-eslint/no-restricted-imports */
import { KTX2Decoder } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).KTX2DECODER = KTX2Decoder;
}

export * from "../index";
