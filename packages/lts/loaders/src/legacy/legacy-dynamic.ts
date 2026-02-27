/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Loaders from "loaders/dynamic";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    const BABYLON = ((<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {});
    for (const key in Loaders) {
        if (!BABYLON[key]) {
            BABYLON[key] = (<any>Loaders)[key];
        }
    }
}

export * from "loaders/dynamic";
