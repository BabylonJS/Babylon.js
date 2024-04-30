import * as BABYLON from "core/index";

// Inspired by previous copyToClipboard() function which was copying Color3
// Copies strCommand to clipboard
export function copyCommandToClipboard(strCommand: string){
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

// Getting instance type (string) of target, for debug purpose
// target.constructor.name actually works in dev preview mode
// target.constructor.name returns a random letter after build, due to mangling
// Looping on BABYLON classes to find real type
export function getInstanceType(target: any): string {
    for (let className in BABYLON) {
        try{
            if (target instanceof (BABYLON[className as keyof typeof BABYLON] as any)){
                return className;
            }
        } catch(err){}
    }
    return "Unknown";
}
