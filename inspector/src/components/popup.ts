export class Popup {
    public static CreatePopup(title: string, windowVariableName: string, width = 300, height = 800) {
        const windowCreationOptionsList = {
            width: width,
            height: height,
            top: (window.innerHeight - width) / 2 + window.screenY,
            left: (window.innerWidth - height) / 2 + window.screenX,
        };

        var windowCreationOptions = Object.keys(windowCreationOptionsList)
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

        let parentControl = parentDocument.createElement("div");
        parentControl.style.width = "100%";
        parentControl.style.height = "100%";
        parentControl.style.margin = "0";
        parentControl.style.padding = "0";

        popupWindow.document.body.appendChild(parentControl);
        this._CopyStyles(window.document, parentDocument);
        setTimeout(() => {
            // need this for late bindings
            this._CopyStyles(window.document, parentDocument);
        }, 0);

        (this as any)[windowVariableName] = popupWindow;

        return parentControl;
    }

    private static _CopyStyles(sourceDoc: HTMLDocument, targetDoc: HTMLDocument) {
        for (var index = 0; index < sourceDoc.styleSheets.length; index++) {
            var styleSheet: any = sourceDoc.styleSheets[index];
            try {
                if (styleSheet.cssRules) {
                    // for <style> elements
                    const newStyleEl = sourceDoc.createElement("style");

                    for (var cssRule of styleSheet.cssRules) {
                        // write the text of each rule into the body of the style element
                        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
                    }

                    targetDoc.head!.appendChild(newStyleEl);
                } else if (styleSheet.href) {
                    // for <link> elements loading CSS from a URL
                    const newLinkEl = sourceDoc.createElement("link");

                    newLinkEl.rel = "stylesheet";
                    newLinkEl.href = styleSheet.href;
                    targetDoc.head!.appendChild(newLinkEl);
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}
