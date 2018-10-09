import * as FileLoader from "../src/glTF/glTFFileLoader";
import * as Loaders from "../src/glTF/1.0";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in FileLoader) {
        (<any>globalObject).BABYLON[key] = (<any>FileLoader)[key];
    }
    for (var key in Loaders) {
        (<any>globalObject).BABYLON[key] = (<any>FileLoader)[key];
    }
}

export * from "../src/glTF/glTFFileLoader";