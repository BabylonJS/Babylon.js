import * as FileLoader from "./glTF/glTFFileLoader";
import * as LoadersV1 from "./glTF/1.0";
import * as LoadersV2 from "./glTF/2.0";
import * as LoadersOBJ from "./OBJ";
import * as LoadersSTL from "./STL";

/**
 * Legacy support, defining window.BABYLON.OBJLoader... (global variable).
 *
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
    for (var key in LoadersOBJ) {
        (<any>globalObject).BABYLON[key] = (<any>LoadersOBJ)[key];
    }
    for (var key in LoadersSTL) {
        (<any>globalObject).BABYLON[key] = (<any>LoadersSTL)[key];
    }
}

export * from "./index";