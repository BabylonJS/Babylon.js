/* eslint-disable import/no-internal-modules */
import { NodeEditor } from "../../../nodeEditor/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeEditor = NodeEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).NODEEDITOR = { NodeEditor };
}

export * from "../../../nodeEditor/src/index";
