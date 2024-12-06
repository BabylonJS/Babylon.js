/**
 * Copy all styles from a document to another document or shadow root
 * @param source document to copy styles from
 * @param target document or shadow root to copy styles to
 */
export function CopyStyles(source: Document, target: DocumentOrShadowRoot) {
    // Copy all <style> elements
    Array.from(source.querySelectorAll("style")).forEach((style) => {
        const newStyle = source.createElement("style");
        newStyle.textContent = style.textContent;
        if ((target as Document).head) {
            (target as Document).head.appendChild(newStyle);
        } else {
            (target as ShadowRoot).appendChild(newStyle);
        }
    });

    // Copy all <link> elements for stylesheets
    Array.from(source.querySelectorAll('link[rel="stylesheet"]')).forEach((link) => {
        const newLink = source.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = (link as HTMLLinkElement).href;
        if ((target as Document).head) {
            (target as Document).head.appendChild(newLink);
        } else {
            (target as ShadowRoot).appendChild(newLink);
        }
    });
}
