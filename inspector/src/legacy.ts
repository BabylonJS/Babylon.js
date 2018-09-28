import * as INSPECTOR from "./index";

/**
 * Legacy support, defining window.INSPECTOR (global variable).
 *
 * This is the entry point for the UMD module.
 * The entry point for a future ESM package should be index.ts
 */

var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : undefined);
if (typeof globalObject !== "undefined") {
    (<any>globalObject).INSPECTOR = INSPECTOR;
}

export * from "./index";