import * as MatLib from "../boneWeights";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in MatLib) {
        (<any>globalObject).BABYLON[key] = (<any>MatLib)[key];
    }
}

export * from "../boneWeights";