import * as ProceduralTexturesLib from "../index";

/**
 * Legacy support, defining window.BABYLON.GridMaterial... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    for (var mat in ProceduralTexturesLib) {
        (<any>globalObject).BABYLON[mat] = (<any>ProceduralTexturesLib)[mat];
    }
}

export * from "../index";