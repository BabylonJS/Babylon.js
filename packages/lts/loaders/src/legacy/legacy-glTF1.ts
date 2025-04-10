/* eslint-disable import/no-internal-modules */
import * as GLTF1 from "loaders/glTF/1.0/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.GLTF1 = (<any>GlobalObject).BABYLON.GLTF1 || {};
    for (const key in GLTF1) {
        (<any>GlobalObject).BABYLON.GLTF1[key] = (<any>GLTF1)[key];
    }
}

export { GLTF1 };
