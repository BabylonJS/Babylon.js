/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as MatLib from "materials/terrain/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    for (const key in MatLib) {
        (<any>globalObject).BABYLON[key] = (<any>MatLib)[key];
    }
}

export * from "materials/terrain/index";
