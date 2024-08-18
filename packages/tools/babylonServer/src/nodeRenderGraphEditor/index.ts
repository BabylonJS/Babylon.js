/* eslint-disable import/no-internal-modules */
import { NodeRenderGraphEditor } from "../../../nodeRenderGraphEditor/src/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.NodeRenderGraphEditor = NodeRenderGraphEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).NODERENDERGRAPHEDITOR = { NodeRenderGraphEditor };
}

export * from "../../../nodeRenderGraphEditor/src/index";
