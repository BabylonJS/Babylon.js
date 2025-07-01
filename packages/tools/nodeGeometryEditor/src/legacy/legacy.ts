/* eslint-disable @typescript-eslint/no-restricted-imports */
import { NodeGeometryEditor } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeGeometryEditor = NodeGeometryEditor;
}

export * from "../index";
