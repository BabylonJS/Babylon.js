import { NodeEditor } from "node-editor/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.NodeEditor = NodeEditor;
    (<any>globalObject).NODEEDITOR = { NodeEditor };
}

export * from "node-editor/index";
