/* eslint-disable import/no-internal-modules */
import { NodeRenderGraphEditor } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeRenderGraphEditor = NodeRenderGraphEditor;
}

export * from "../index";
