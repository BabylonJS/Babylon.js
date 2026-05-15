/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as MatLib from "materials/index";

/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    for (const mat in MatLib) {
        (<any>GlobalObject).BABYLON[mat] = (<any>MatLib)[mat];
    }
    (<any>GlobalObject).MATERIALS = MatLib;
}

export * from "materials/index";
