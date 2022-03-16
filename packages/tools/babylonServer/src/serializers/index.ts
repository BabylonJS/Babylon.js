import * as SERIALIZERS from "./legacy";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).SERIALIZERS = SERIALIZERS;
}

export * from "./legacy";
