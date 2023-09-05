/* eslint-disable import/no-internal-modules */
import { NodeGeometryEditor } from "../../../nodeGeometryEditor/src/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.NodeGeometryEditor = NodeGeometryEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).NODEGEOMETRYEDITOR = { NodeGeometryEditor };
}

export * from "../../../nodeGeometryEditor/src/index";
