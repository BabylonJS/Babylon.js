/**
 * Copy all styles from a document to another document or shadow root
 * @param source document to copy styles from
 * @param target document or shadow root to copy styles to
 */
export function CopyStyles(source: Document, target: Document) {
    // Copy all <style> elements
    Array.from(source.querySelectorAll("style")).forEach((style) => {
        const newStyle = target.createElement("style");
        newStyle.textContent = style.textContent;
        target.head.appendChild(newStyle);
    });

    // Copy all <link> elements for stylesheets
    Array.from(source.querySelectorAll('link[rel="stylesheet"]')).forEach((link) => {
        const newLink = target.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = (link as HTMLLinkElement).href;
        target.head.appendChild(newLink);
    });
}
