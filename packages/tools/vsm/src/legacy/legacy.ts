/* eslint-disable @typescript-eslint/no-restricted-imports */
import { VSM } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.VSM = VSM;
    (<any>GlobalObject).BABYLON.vsm = VSM;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).VSM = { VSM };
}

export * from "../index";
