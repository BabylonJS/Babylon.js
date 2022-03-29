/* eslint-disable import/no-internal-modules */
import * as postProcessLibrary from "post-processes/asciiArt/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const key in postProcessLibrary) {
        (<any>globalObject).BABYLON[key] = (<any>postProcessLibrary)[key];
    }
}

export * from "post-processes/asciiArt/index";
