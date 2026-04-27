/* eslint-disable @typescript-eslint/no-restricted-imports */
import * as proceduralTexture from "procedural-textures/normalMap/index";

/**
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    for (const key in proceduralTexture) {
        (<any>GlobalObject).BABYLON[key] = (<any>proceduralTexture)[key];
    }
}

export * from "procedural-textures/normalMap/index";
