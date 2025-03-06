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

/**
 * Merges classNames by array of strings or conditions
 * @param classNames Array of className strings or truthy conditions
 * @returns A concatenated string, suitable for the className attribute
 */
export function MergeClassNames(classNames: ClassNameCondition[]): string {
    return classNames
        .reduce((accumulator: string[], className: ClassNameCondition) => {
            if (typeof className === "string") {
                accumulator.push(className);
            } else if (className) {
                if (className[1]) {
                    accumulator.push(className[0]);
                }
            }
            return accumulator;
        }, [])
        .join(" ");
}

/**
 * className (replicating React type) or a tuple with the second member being any truthy value ["className", true]
 */
type ClassNameCondition = string | undefined | [string, any];
