// Inspired by previous copyToClipboard() function which was copying Color3
// Copies strCommand to clipboard
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
