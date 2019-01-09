import * as Extensions from "../glTF/2.0/Extensions";
import * as Interfaces from "../glTF/2.0/glTFLoaderInterfaces";
import * as GLTF2 from "../glTF/2.0";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    var BABYLON = (<any>globalObject).BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Loader = BABYLON.GLTF2.Loader || {};
    BABYLON.GLTF2.Loader.Extensions = BABYLON.GLTF2.Loader.Extensions || {};

    const keys = [];
    for (var key in Extensions) {
        BABYLON.GLTF2.Loader.Extensions[key] = (<any>Extensions)[key];
        keys.push(key);
    }
    for (var key in Interfaces) {
        BABYLON.GLTF2.Loader[key] = (<any>Interfaces)[key];
        keys.push(key);
    }

    for (var key in GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }

        BABYLON.GLTF2[key] = (<any>GLTF2)[key];
    }
}

export { GLTF2 };