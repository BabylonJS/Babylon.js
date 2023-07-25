/* eslint-disable import/no-internal-modules */
import { NodeGeometryEditor } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.NodeGeometryEditor = NodeGeometryEditor;
}

export * from "../index";
