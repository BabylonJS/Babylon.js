/* eslint-disable import/export */
/* eslint-disable import/namespace */
import * as SERIALIZERS from "./legacy-dev";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).SERIALIZERS = SERIALIZERS;
}

export * from "./legacy-dev";
