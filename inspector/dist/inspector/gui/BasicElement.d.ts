declare module INSPECTOR {
    /**
     * Represents a html div element.
     * The div is built when an instance of BasicElement is created.
     */
    abstract class BasicElement {
        protected _div: HTMLElement;
        constructor();
        /**
         * Returns the div element
         */
        toHtml(): HTMLElement;
        /**
         * Build the html element
         */
        protected _build(): void;
        abstract update(data?: any): any;
        /** Default dispose method if needed */
        dispose(): void;
    }
}
