/* eslint-disable import/no-internal-modules */
import * as MatLib from "materials/index";

/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    for (const mat in MatLib) {
        (<any>globalObject).BABYLON[mat] = (<any>MatLib)[mat];
    }
}

export * from "materials/index";
