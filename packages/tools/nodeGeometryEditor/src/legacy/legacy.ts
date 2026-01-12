/* eslint-disable @typescript-eslint/no-restricted-imports */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as NODEGEOMETRYEDITOR from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeGeometryEditor = NODEGEOMETRYEDITOR.NodeGeometryEditor;
    (<any>GlobalObject).BABYLON.NODEGEOMETRYEDITOR = NODEGEOMETRYEDITOR;
}

export * from "../index";
