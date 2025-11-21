/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as postProcessLibrary from "../../../../dev/postProcesses/src/index";

/**
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const key in postProcessLibrary) {
        (<any>GlobalObject).BABYLON[key] = (<any>postProcessLibrary)[key];
    }
}

export * from "../../../../dev/postProcesses/src/index";
