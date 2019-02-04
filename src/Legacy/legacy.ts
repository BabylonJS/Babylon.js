import * as Babylon from "../index";
import * as Debug from "../Debug/index";

declare var global: any;

/**
 * Legacy support, defining window.BABYLON (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = BABYLON;
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    var BABYLON = (<any>globalObject).BABYLON;
    BABYLON.Debug = BABYLON.Debug || {};

    const keys = [];
    for (var key in Debug) {
        BABYLON.Debug[key] = (<any>Debug)[key];
        keys.push(key);
    }
    for (var key in Babylon) {
        // Prevent Reassignment.
        // if (keys.indexOf(key) > -1) {
        // continue;
        // }

        BABYLON[key] = (<any>Babylon)[key];
    }
}

export * from "../index";