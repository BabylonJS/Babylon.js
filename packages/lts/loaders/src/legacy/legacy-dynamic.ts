import * as Loaders from "loaders/dynamic";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    for (const key in Loaders) {
        (<any>GlobalObject).BABYLON[key] = (<any>Loaders)[key];
    }
}

export * from "loaders/dynamic";
