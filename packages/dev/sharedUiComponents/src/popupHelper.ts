import { CopyStyles } from "./styleHelper";

/**
 * Create a popup window
 * @param title default title for the popup
 * @param options options for the popup
 * @returns the parent control of the popup
 */
export function CreatePopup(
    title: string,
    options: Partial<{
        onParentControlCreateCallback?: (parentControl: HTMLDivElement) => void;
        onWindowCreateCallback?: (newWindow: Window) => void;
        width?: number;
        height?: number;
    }>
) {
    const localOptions = {
        width: 300,
        height: 800,
        ...options,
    };

    const windowCreationOptionsList = {
        width: localOptions.width,
        height: localOptions.height,
        top: (window.innerHeight - localOptions.width) / 2 + window.screenY,
        left: (window.innerWidth - localOptions.height) / 2 + window.screenX,
    };

    const windowCreationOptions = Object.keys(windowCreationOptionsList)
        .map((key) => key + "=" + (windowCreationOptionsList as any)[key])
        .join(",");

    const popupWindow = window.open("", title, windowCreationOptions);
    if (!popupWindow) {
        return null;
    }

    const parentDocument = popupWindow.document;

    // Font
    const newLinkEl = parentDocument.createElement("link");

    newLinkEl.rel = "stylesheet";
    newLinkEl.href = "https://use.typekit.net/cta4xsb.css";
    parentDocument.head!.appendChild(newLinkEl);

    parentDocument.title = title;
    parentDocument.body.style.width = "100%";
    parentDocument.body.style.height = "100%";
    parentDocument.body.style.margin = "0";
    parentDocument.body.style.padding = "0";

    const parentControl = parentDocument.createElement("div");
    parentControl.style.width = "100%";
    parentControl.style.height = "100%";
    parentControl.style.margin = "0";
    parentControl.style.padding = "0";

    if (localOptions.onParentControlCreateCallback) {
        localOptions.onParentControlCreateCallback(parentControl);
    }

    popupWindow.document.body.appendChild(parentControl);
    CopyStyles(window.document, parentDocument);
    setTimeout(() => {
        // need this for late bindings
        CopyStyles(window.document, parentDocument);
    }, 0);

    if (localOptions.onWindowCreateCallback) {
        localOptions.onWindowCreateCallback(popupWindow);
    }

    return parentControl;
}
