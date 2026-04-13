/* eslint-disable @typescript-eslint/no-restricted-imports */
import { FlowGraphEditor } from "../../../flowGraphEditor/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.FlowGraphEditor = FlowGraphEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).FLOWGRAPHEDITOR = { FlowGraphEditor };
}

export * from "../../../flowGraphEditor/src/index";
