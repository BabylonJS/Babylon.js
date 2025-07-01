/* eslint-disable @typescript-eslint/no-restricted-imports */
import { NodeGeometryEditor } from "../../../nodeGeometryEditor/src/index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.NodeGeometryEditor = NodeGeometryEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).NODEGEOMETRYEDITOR = { NodeGeometryEditor };
}

export * from "../../../nodeGeometryEditor/src/index";
