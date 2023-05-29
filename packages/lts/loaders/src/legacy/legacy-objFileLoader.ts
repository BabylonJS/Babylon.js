/* eslint-disable import/no-internal-modules */
import * as Loaders from "loaders/OBJ/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const key in Loaders) {
        if (!(<any>globalObject).BABYLON[key]) {
            (<any>globalObject).BABYLON[key] = (<any>Loaders)[key];
        }
    }
}

export * from "loaders/OBJ/index";
