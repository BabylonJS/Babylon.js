/* eslint-disable import/no-internal-modules */
import * as Loaders from "loaders/STL/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const key in Loaders) {
        if (!(<any>GlobalObject).BABYLON[key]) {
            (<any>GlobalObject).BABYLON[key] = (<any>Loaders)[key];
        }
    }
}

export * from "loaders/STL/index";
