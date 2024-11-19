/**
 * Copy all styles from a document to another document or shadow root
 * @param source document to copy styles from
 * @param target document or shadow root to copy styles to
 */
export function CopyStyles(source: Document, target: DocumentOrShadowRoot) {
    for (let index = 0; index < source.styleSheets.length; index++) {
        const styleSheet: any = source.styleSheets[index];

        try {
            if (styleSheet.cssRules) {
                // for <style> elements
                const newStyleEl = source.createElement("style");

                for (const cssRule of styleSheet.cssRules) {
                    // write the text of each rule into the body of the style element
                    newStyleEl.appendChild(source.createTextNode(cssRule.cssText));
                }

                if ((target as Document).head) {
                    (target as Document).head.appendChild(newStyleEl);
                } else {
                    (target as ShadowRoot).appendChild(newStyleEl);
                }
            } else if (styleSheet.href) {
                // for <link> elements loading CSS from a URL
                const newLinkEl = source.createElement("link");

                newLinkEl.rel = "stylesheet";
                newLinkEl.href = styleSheet.href;
                if ((target as Document).head) {
                    (target as Document).head.appendChild(newLinkEl);
                } else {
                    (target as ShadowRoot).appendChild(newLinkEl);
                }
            }
        } catch (e) {}
    }
}
