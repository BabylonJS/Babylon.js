/* eslint-disable import/no-internal-modules */
import * as ProceduralTexturesLib from "../../../../dev/proceduralTextures/src/index";

/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    for (const mat in ProceduralTexturesLib) {
        (<any>GlobalObject).BABYLON[mat] = (<any>ProceduralTexturesLib)[mat];
    }
}

export * from "../../../../dev/proceduralTextures/src/index";
