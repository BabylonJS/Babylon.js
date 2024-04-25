import * as BABYLON from "core/index";

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
