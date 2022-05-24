/* eslint-disable import/no-internal-modules */
import { GUIEditor } from "../../../guiEditor/src/index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.GuiEditor = GUIEditor;
    (<any>globalObject).BABYLON.GUIEditor = GUIEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).GUIEDITOR = { GUIEditor };
}

export * from "../../../guiEditor/src/index";
