/* eslint-disable import/no-internal-modules */
import { NodeEditor } from "../../../nodeEditor/src/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.NodeEditor = NodeEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).NODEEDITOR = { NodeEditor };
}

export * from "../../../nodeEditor/src/index";
