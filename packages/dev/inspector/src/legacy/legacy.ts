/* eslint-disable import/no-internal-modules */
import * as INSPECTOR from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.Inspector = INSPECTOR.Inspector;
    (<any>globalObject).INSPECTOR = INSPECTOR;
}

export * from "../index";
