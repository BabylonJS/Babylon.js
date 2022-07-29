/* eslint-disable import/no-internal-modules */
import * as GUI from "gui/index";

/**
 * Legacy support, defining window.BABYLON.GUI (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    if (!(<any>globalObject).BABYLON.GUI) {
        (<any>globalObject).BABYLON.GUI = GUI;
    }
}

export * from "gui/index";
