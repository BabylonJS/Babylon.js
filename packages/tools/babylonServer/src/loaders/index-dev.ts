/* eslint-disable import/export */
/* eslint-disable import/no-internal-modules */
// export * from "../../../../dev/loaders/src/index";
// export * from "./legacy-glTF";
// export * from "./legacy-glTF1";
// export * from "./legacy-glTF2";
// export * from "./legacy-objFileLoader";
// export * from "./legacy-stlFileLoader";

import * as LOADERS from "../../../../dev/loaders/src/index";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    for (const key in LOADERS) {
        (<any>globalObject).BABYLON[key] = (<any>LOADERS)[key];
    }
    // for (const key in Validation) {
    //     (<any>globalObject).BABYLON[key] = (<any>Validation)[key];
    // }
}

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    const BABYLON = (<any>globalObject).BABYLON;
    BABYLON.GLTF2 = BABYLON.GLTF2 || {};
    BABYLON.GLTF2.Loader = BABYLON.GLTF2.Loader || {};
    BABYLON.GLTF2.Loader.Extensions = BABYLON.GLTF2.Loader.Extensions || {};

    const keys = [];
    for (const key in LOADERS.GLTF2) {
        if (key !== "Loader") {
            BABYLON.GLTF2.Loader.Extensions[key] = (<any>LOADERS.GLTF2)[key];
            keys.push(key);
        }
    }
    for (const key in LOADERS.GLTF2) {
        BABYLON.GLTF2.Loader[key] = (<any>LOADERS.GLTF2)[key];
        keys.push(key);
    }

    for (const key in LOADERS.GLTF2) {
        // Prevent Reassignment.
        if (keys.indexOf(key) > -1) {
            continue;
        }

        BABYLON.GLTF2[key] = (<any>LOADERS.GLTF2)[key];
    }
}
