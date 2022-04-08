/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
import { Inspector } from "../../../../dev/inspector/src/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.Inspector = Inspector;
    (<any>globalObject).INSPECTOR = { Inspector };
}

export * from "../../../../dev/inspector/src/index";
