/* eslint-disable import/no-internal-modules */
import * as MatLib from "materials/cell/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const key in MatLib) {
        (<any>GlobalObject).BABYLON[key] = (<any>MatLib)[key];
    }
}

export * from "materials/cell/index";
