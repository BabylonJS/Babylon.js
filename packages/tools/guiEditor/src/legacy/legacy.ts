/* eslint-disable import/no-internal-modules */
import { GUIEditor } from "../index";

const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    (<any>GlobalObject).BABYLON = (<any>GlobalObject).BABYLON || {};
    (<any>GlobalObject).BABYLON.GuiEditor = GUIEditor;
    (<any>GlobalObject).BABYLON.GUIEditor = GUIEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>GlobalObject).GUIEDITOR = { GUIEditor };
}

export * from "../index";
