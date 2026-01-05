/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-restricted-imports */
// export * from "../../../../dev/loaders/src/index";
// export * from "./legacy-glTF";
// export * from "./legacy-glTF1";
// export * from "./legacy-glTF2";
// export * from "./legacy-objFileLoader";
// export * from "./legacy-stlFileLoader";

// eslint-disable-next-line @typescript-eslint/naming-convention
import * as LOADERS from "../../../../dev/loaders/src/index";
/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    for (const key in LOADERS) {
        (<any>GlobalObject).BABYLON[key] = (<any>LOADERS)[key];
    }
    // for (const key in Validation) {
    //     (<any>globalObject).BABYLON[key] = (<any>Validation)[key];
    // }
}

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const BABYLON = (<any>GlobalObject).BABYLON;
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
