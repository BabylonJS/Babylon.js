/**
 * Sets of helpers dealing with the DOM and some of the recurrent functions needed in
 * Babylon.js
 */
export class DomManagement {
    /**
     * Checks if the window object exists
     * @returns true if the window object exists
     */
    public static IsWindowObjectExist(): boolean {
        return (typeof window) !== "undefined";
    }

    /**
     * Extracts text content from a DOM element hierarchy
     * @param element defines the root element
     * @returns a string
     */
    public static GetDOMTextContent(element: HTMLElement): string {
        var result = "";
        var child = element.firstChild;

        while (child) {
            if (child.nodeType === 3) {
                result += child.textContent;
            }
            child = <any>(child.nextSibling);
        }

        return result;
    }
}