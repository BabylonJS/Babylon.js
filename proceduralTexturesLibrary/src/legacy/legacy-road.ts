import * as proceduralTexture from "../road/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in proceduralTexture) {
        (<any>globalObject).BABYLON[key] = (<any>proceduralTexture)[key];
    }
}

export * from "../road/index";