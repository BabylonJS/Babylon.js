/* eslint-disable @typescript-eslint/no-restricted-imports */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as NODEEDITOR from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeEditor = NODEEDITOR.NodeEditor;
    (<any>GlobalObject).BABYLON.NODEEDITOR = NODEEDITOR;
}

export * from "../index";
