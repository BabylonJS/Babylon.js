/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as Addons from "../../../../dev/addons/src/index";

/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    for (const mat in Addons) {
        (<any>GlobalObject).BABYLON[mat] = (<any>Addons)[mat];
    }
    (<any>GlobalObject).ADDONS = Addons;
}

export * from "../../../../dev/addons/src/index";
