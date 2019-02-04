import * as Loaders from "../OBJ";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    for (var key in Loaders) {
        (<any>globalObject).BABYLON[key] = (<any>Loaders)[key];
    }
}

export * from "../OBJ";