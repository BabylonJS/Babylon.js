/* eslint-disable @typescript-eslint/no-restricted-imports */
import { NodeRenderGraphEditor } from "../../../nodeRenderGraphEditor/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeRenderGraphEditor = NodeRenderGraphEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).NODERENDERGRAPHEDITOR = { NodeRenderGraphEditor };
}

export * from "../../../nodeRenderGraphEditor/src/index";
