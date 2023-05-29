/* eslint-disable import/no-internal-modules */
import { VSM } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.VSM = VSM;
    (<any>globalObject).BABYLON.vsm = VSM;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).VSM = { VSM };
}

export * from "../index";
