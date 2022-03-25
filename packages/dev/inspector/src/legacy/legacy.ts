/* eslint-disable import/no-internal-modules */
import { Inspector } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.Inspector = Inspector;
    (<any>globalObject).INSPECTOR = Inspector;
}

export * from "../index";
