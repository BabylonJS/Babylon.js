import { GetClassName } from "core/Misc/typeStore";

// Check if BABYLON namespace exists
let BabylonNamespace = "";
const GlobalObject = typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : undefined;
if (typeof GlobalObject !== "undefined") {
    if (typeof (<any>GlobalObject).BABYLON !== "undefined") {
        BabylonNamespace = "BABYLON.";
    }
}

// Inspired by previous copyToClipboard() function which was copying Color3
// Copies strCommand to clipboard
// eslint-disable-next-line @typescript-eslint/naming-convention
export function copyCommandToClipboard(strCommand: string) {
    const element = document.createElement("div");
    element.textContent = strCommand;
    document.body.appendChild(element);

    if (window.getSelection) {
        const range = document.createRange();
        range.selectNode(element);
        window.getSelection()!.removeAllRanges();
        window.getSelection()!.addRange(range);
    }

    document.execCommand("copy");
    element.remove();
}

// Return the class name of the considered target
// babylonNamespace is either "" (ES6) or "BABYLON."
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getClassNameWithNamespace(obj: any): { className: string; babylonNamespace: string } {
    let className = GetClassName(obj);
    if (className.includes("BABYLON.")) {
        className = className.split("BABYLON.")[1];
    }
    return { className, babylonNamespace: BabylonNamespace };
}
