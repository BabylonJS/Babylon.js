import * as FileLoader from "../src/glTF/glTFFileLoader";
import * as LoadersV1 from "../src/glTF/1.0";
import * as LoadersV2 from "../src/glTF/2.0";

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
    (<any>globalObject).BABYLON.GLTF1 = (<any>globalObject).BABYLON.GLTF1 || { };
    for (var key in LoadersV1) {
        (<any>globalObject).BABYLON.GLTF1[key] = (<any>LoadersV1)[key];
    }
    for (var key in LoadersV2) {
        (<any>globalObject).BABYLON[key] = (<any>LoadersV2)[key];
    }
}

export * from "../src/glTF/glTFFileLoader";
export * from "../src/glTF/1.0";
export * from "../src/glTF/2.0";