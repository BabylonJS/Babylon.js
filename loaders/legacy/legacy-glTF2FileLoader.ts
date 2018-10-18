import * as FileLoader from "../src/glTF/glTFFileLoader";
import * as GLTF2 from "../src/glTF/2.0";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || { };
    for (var key in FileLoader) {
        (<any>globalObject).BABYLON[key] = (<any>FileLoader)[key];
    }
    for (var key in GLTF2) {
        (<any>globalObject).BABYLON[key] = (<any>GLTF2)[key];
    }
}

export * from "../src/glTF/glTFFileLoader";
export { GLTF2 };