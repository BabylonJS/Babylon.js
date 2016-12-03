declare module INSPECTOR {
    /**
     * Creates a tooltip for the given html element
     */
    class Tooltip {
        /** The tooltip is displayed for this element */
        private _elem;
        /** The tooltip div */
        private _infoDiv;
        constructor(elem: HTMLElement, tip: string);
    }
}
