/* eslint-disable @typescript-eslint/no-restricted-imports */
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as NODERENDERGRAPHEDITOR from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeRenderGraphEditor = NODERENDERGRAPHEDITOR.NodeRenderGraphEditor;
    (<any>GlobalObject).BABYLON.NODERENDERGRAPHEDITOR = NODERENDERGRAPHEDITOR;
}

export * from "../index";
