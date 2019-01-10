import * as postProcessLibrary from "../digitalRain/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in postProcessLibrary) {
        (<any>globalObject).BABYLON[key] = (<any>postProcessLibrary)[key];
    }
}

export * from "../digitalRain/index";