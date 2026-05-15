/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Extensions from "loaders/glTF/2.0/Extensions/index";
import * as Interfaces from "loaders/glTF/2.0/glTFLoaderInterfaces";
import * as GLTF2 from "loaders/glTF/2.0/index";

const LoaderExtensions = { ...Extensions };
const GLTF2Loader = {
    ...Interfaces,
    ["Extensions"]: LoaderExtensions,
};
const GLTF2Legacy = {
    ...GLTF2,
    ["Loader"]: GLTF2Loader,
} as typeof GLTF2;

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

    const keys = ["Loader"];
    for (const key in LoaderExtensions) {
        BABYLON.GLTF2.Loader.Extensions[key] = (<any>LoaderExtensions)[key];
        keys.push(key);
    }
    for (const key in GLTF2Loader) {
        if (key === "Extensions") {
            continue;
        }

        BABYLON.GLTF2.Loader[key] = (<any>GLTF2Loader)[key];
        keys.push(key);
    }

    for (const key in GLTF2Legacy) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }

        BABYLON.GLTF2[key] = (<any>GLTF2Legacy)[key];
    }
}

export { GLTF2Legacy as GLTF2 };
