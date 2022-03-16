import { GUIEditor } from "@tools/gui-editor";

const globalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof globalObject !== "undefined") {
    (<any>globalObject).BABYLON = (<any>globalObject).BABYLON || {};
    (<any>globalObject).BABYLON.GuiEditor = GUIEditor;
    (<any>globalObject).GUIEDITOR = GUIEditor;
}

export * from "@tools/gui-editor";
