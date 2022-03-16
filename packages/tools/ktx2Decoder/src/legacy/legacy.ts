import { KTX2Decoder } from "../index";

var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).KTX2DECODER = KTX2Decoder;
}

export * from "../index";