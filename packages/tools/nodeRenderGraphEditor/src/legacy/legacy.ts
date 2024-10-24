/* eslint-disable import/no-internal-modules */
import { NodeRenderGraphEditor } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.NodeRenderGraphEditor = NodeRenderGraphEditor;
}

export * from "../index";
