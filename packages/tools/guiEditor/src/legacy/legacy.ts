import { GUIEditor } from "../index";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.GuiEditor = GUIEditor;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (<any>globalObject).GUIEDITOR = { GUIEditor };
}

export * from "../index";
