import * as GLTF1 from "../glTF/1.0";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.GLTF1 = (<any>globalObject).BABYLON.GLTF1 || {};
    for (var key in GLTF1) {
        (<any>globalObject).BABYLON.GLTF1[key] = (<any>GLTF1)[key];
    }
}

export { GLTF1 };