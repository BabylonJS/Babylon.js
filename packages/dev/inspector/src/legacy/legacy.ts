/* eslint-disable @typescript-eslint/no-restricted-imports */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as INSPECTOR from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.Inspector = INSPECTOR.Inspector;
    (<any>GlobalObject).INSPECTOR = INSPECTOR;
}

export * from "../index";
