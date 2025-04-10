/* eslint-disable import/no-internal-modules */
import * as Extensions from "loaders/glTF/2.0/Extensions/index";
import * as Interfaces from "loaders/glTF/2.0/glTFLoaderInterfaces";
import * as GLTF2 from "loaders/glTF/2.0/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BABYLON = (<any>GlobalObject).BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Loader = BABYLON.GLTF2.Loader || {};
    BABYLON.GLTF2.Loader.Extensions = BABYLON.GLTF2.Loader.Extensions || {};

    const keys = [];
    for (const key in Extensions) {
        BABYLON.GLTF2.Loader.Extensions[key] = (<any>Extensions)[key];
        keys.push(key);
    }
    for (const key in Interfaces) {
        BABYLON.GLTF2.Loader[key] = (<any>Interfaces)[key];
        keys.push(key);
    }

    for (const key in GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }

        BABYLON.GLTF2[key] = (<any>GLTF2)[key];
    }
}

export { GLTF2 };
