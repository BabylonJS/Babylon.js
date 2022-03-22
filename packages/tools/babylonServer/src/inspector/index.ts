/* eslint-disable @typescript-eslint/naming-convention */
import { Inspector } from "inspector/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.Inspector = Inspector;
    (<any>globalObject).INSPECTOR = { Inspector };
}

export * from "inspector/index";
