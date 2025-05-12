/* eslint-disable import/no-internal-modules */
import { NodeEditor } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeEditor = NodeEditor;
}

export * from "../index";
