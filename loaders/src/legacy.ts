import * as Loaders from "./index";

/**
 * Legacy support, defining window.BABYLON.OBJLoader... (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    for (var loader in Loaders) {
        if (Loaders.hasOwnProperty(loader)) {
            (<any>globalObject).BABYLON[loader] = (<any>Loaders)[loader];
        }
    }
}

export * from "./index";